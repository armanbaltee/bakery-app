import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { authRoutes } from '../routes/auth.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount on both /api/auth and root for direct API Gateway / CloudFront path compatibility
app.route('/api/auth', authRoutes);
app.route('/auth', authRoutes);
app.route('/', authRoutes);

export const handler = handle(app);
