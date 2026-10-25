import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { uploadsRoutes } from '../routes/uploads.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/uploads', uploadsRoutes);
app.route('/uploads', uploadsRoutes);
app.route('/', uploadsRoutes);

export const handler = handle(app);
