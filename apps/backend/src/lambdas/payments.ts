import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { paymentsRoutes } from '../routes/payments.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/payments', paymentsRoutes);
app.route('/payments', paymentsRoutes);
app.route('/', paymentsRoutes);

export const handler = handle(app);
