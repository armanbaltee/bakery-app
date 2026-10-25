import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { categoriesRoutes } from '../routes/categories.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/categories', categoriesRoutes);
app.route('/categories', categoriesRoutes);
app.route('/', categoriesRoutes);

export const handler = handle(app);
