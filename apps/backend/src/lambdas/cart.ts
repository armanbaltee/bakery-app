import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { cartRoutes } from '../routes/cart.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/cart', cartRoutes);
app.route('/cart', cartRoutes);
app.route('/', cartRoutes);

export const handler = handle(app);
