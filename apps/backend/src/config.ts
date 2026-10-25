export const config = {
  tableName: process.env['TABLE_NAME'] || 'BakeryTable',
  region: process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-east-1',
  dynamoEndpoint: process.env['DYNAMODB_ENDPOINT'], // for local development if needed
  jwtSecret: process.env['JWT_SECRET'] || 'bakery-secret-key-change-in-production-123456789',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  uploadsBucket: process.env['UPLOADS_BUCKET_NAME'] || 'bakery-uploads-bucket',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:4200',
  adminUrl: process.env['ADMIN_URL'] || 'http://localhost:4201',
};
