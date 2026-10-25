import * as cdk from 'aws-cdk-lib';
import { BakeryStack } from '../lib/bakery-stack';
import * as path from 'path';

test('BakeryStack synthesizes correctly', () => {
  const app = new cdk.App();
  expect(() => new BakeryStack(app, 'TestBakeryStack', {
    env: { account: '123456789012', region: 'us-east-1' },
  })).not.toThrow();
});
