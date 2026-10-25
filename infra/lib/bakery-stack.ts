import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_s3_deployment as s3deploy,
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as integrations,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class BakeryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ─────────────────────────────────────────────────
    // 1. DYNAMODB: Single Table Design
    // ─────────────────────────────────────────────────
    const bakeryTable = new dynamodb.Table(this, 'BakeryTable', {
      tableName: 'BakeryTable',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Pay-as-you-go (zero fixed cost)
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // GSI1 for customer lookups and category/product listings
    bakeryTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─────────────────────────────────────────────────
    // 2. S3: Uploads Bucket (Product Images)
    // ─────────────────────────────────────────────────
    const uploadsBucket = new s3.Bucket(this, 'BakeryUploadsBucket', {
      bucketName: `bakery-uploads-${this.account}-${this.region}`,
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    uploadsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [uploadsBucket.arnForObjects('*')],
        principals: [new iam.AnyPrincipal()],
      })
    );

    // ─────────────────────────────────────────────────
    // 3. S3: Admin & User Frontend Static Buckets
    // ─────────────────────────────────────────────────
    const adminBucket = new s3.Bucket(this, 'BakeryAdminBucket', {
      bucketName: `bakery-admin-${this.account}-${this.region}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const userBucket = new s3.Bucket(this, 'BakeryUserBucket', {
      bucketName: `bakery-user-${this.account}-${this.region}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ─────────────────────────────────────────────────
    // 4. HTTP API GATEWAY
    // ─────────────────────────────────────────────────
    const httpApi = new apigwv2.HttpApi(this, 'BakeryHttpApi', {
      apiName: 'bakery-api',
      description: 'Bakery Serverless HTTP API Gateway',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: Duration.days(1),
      },
    });

    // ─────────────────────────────────────────────────
    // 5. INDIVIDUAL TYPESCRIPT LAMBDA FUNCTIONS
    // (Har lambda ka apna isolated build bundle hota hai)
    // ─────────────────────────────────────────────────
    const commonLambdaEnv = {
      NODE_ENV: 'production',
      TABLE_NAME: bakeryTable.tableName,
      UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
      AWS_REGION_CONFIG: this.region,
    };

    const lambdaConfigs = [
      { name: 'auth', path: '/api/auth' },
      { name: 'categories', path: '/api/categories' },
      { name: 'products', path: '/api/products' },
      { name: 'cart', path: '/api/cart' },
      { name: 'orders', path: '/api/orders' },
      { name: 'payments', path: '/api/payments' },
      { name: 'reports', path: '/api/reports' },
      { name: 'uploads', path: '/api/uploads' },
      { name: 'users', path: '/api/users' },
    ];

    for (const cfg of lambdaConfigs) {
      const fn = new lambda.Function(this, `Bakery${capitalize(cfg.name)}Lambda`, {
        functionName: `bakery-${cfg.name}-lambda`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, `../../apps/backend/dist/lambdas/${cfg.name}`)
        ),
        memorySize: 256,
        timeout: Duration.seconds(15),
        environment: commonLambdaEnv,
      });

      // Grant permissions
      bakeryTable.grantReadWriteData(fn);
      if (cfg.name === 'uploads' || cfg.name === 'products') {
        uploadsBucket.grantReadWrite(fn);
      }

      // Route in API Gateway
      const integration = new integrations.HttpLambdaIntegration(
        `${cfg.name}Integration`,
        fn
      );

      httpApi.addRoutes({
        path: `${cfg.path}/{proxy+}`,
        methods: [apigwv2.HttpMethod.ANY],
        integration: integration,
      });

      httpApi.addRoutes({
        path: cfg.path,
        methods: [apigwv2.HttpMethod.ANY],
        integration: integration,
      });
    }

    // ─────────────────────────────────────────────────
    // 6. CLOUDFRONT: Admin Portal Distribution
    // ─────────────────────────────────────────────────
    const adminOAC = new cloudfront.S3OriginAccessControl(this, 'AdminOAC', {
      description: 'Admin Portal OAC',
    });

    const adminDistribution = new cloudfront.Distribution(
      this,
      'BakeryAdminDistribution',
      {
        comment: 'Bakery Admin Portal - CloudFront CDN',
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(adminBucket, {
            originAccessControl: adminOAC,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(
              `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            originRequestPolicy:
              cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          },
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      }
    );

    // ─────────────────────────────────────────────────
    // 7. CLOUDFRONT: User Storefront Distribution
    // ─────────────────────────────────────────────────
    const userOAC = new cloudfront.S3OriginAccessControl(this, 'UserOAC', {
      description: 'User Storefront OAC',
    });

    const userDistribution = new cloudfront.Distribution(
      this,
      'BakeryUserDistribution',
      {
        comment: 'Bakery User Storefront - CloudFront CDN',
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(userBucket, {
            originAccessControl: userOAC,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(
              `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            originRequestPolicy:
              cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          },
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      }
    );

    // ─────────────────────────────────────────────────
    // 8. S3 DEPLOYMENTS: Frontend Assets Upload
    // ─────────────────────────────────────────────────
    new s3deploy.BucketDeployment(this, 'DeployAdminSite', {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, '../../dist/apps/admin/browser')
        ),
        s3deploy.Source.data(
          'env-config.js',
          `window.__ENV__ = { apiUrl: "${httpApi.url}api" };\n`
        ),
      ],
      destinationBucket: adminBucket,
      distribution: adminDistribution,
      distributionPaths: ['/*'],
    });

    new s3deploy.BucketDeployment(this, 'DeployUserSite', {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, '../../dist/apps/user/browser')
        ),
        s3deploy.Source.data(
          'env-config.js',
          `window.__ENV__ = { apiUrl: "${httpApi.url}api" };\n`
        ),
      ],
      destinationBucket: userBucket,
      distribution: userDistribution,
      distributionPaths: ['/*'],
    });

    // ─────────────────────────────────────────────────
    // 9. CLOUDFORMATION OUTPUTS
    // ─────────────────────────────────────────────────
    new CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.url ?? '',
      description: 'HTTP API Gateway Base URL',
      exportName: 'BakeryApiUrl',
    });

    new CfnOutput(this, 'AdminCloudFrontUrl', {
      value: `https://${adminDistribution.distributionDomainName}`,
      description: 'Admin Portal CloudFront URL',
      exportName: 'BakeryAdminUrl',
    });

    new CfnOutput(this, 'UserCloudFrontUrl', {
      value: `https://${userDistribution.distributionDomainName}`,
      description: 'User Storefront CloudFront URL',
      exportName: 'BakeryUserUrl',
    });

    new CfnOutput(this, 'DynamoTableName', {
      value: bakeryTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: 'BakeryDynamoTable',
    });

    new CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 Product Uploads Bucket Name',
      exportName: 'BakeryUploadsBucket',
    });
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
