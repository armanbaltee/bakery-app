#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BakeryStack } from '../lib/bakery-stack';

const app = new cdk.App();

new BakeryStack(app, 'BakeryStack', {
  env: {
    account: process.env['CDK_DEFAULT_ACCOUNT'],
    region: process.env['CDK_DEFAULT_REGION'] || 'us-east-1',
  },
  description: 'Bakery App Full-Stack: Lambda (Hono) + DynamoDB + S3 + CloudFront + API Gateway',
});

app.synth();
