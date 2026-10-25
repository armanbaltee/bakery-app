import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { ordersRoutes } from '../routes/orders.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/orders', ordersRoutes);
app.route('/orders', ordersRoutes);
app.route('/', ordersRoutes);

export const handler = handle(app);
