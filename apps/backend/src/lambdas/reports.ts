import { Hono } from 'hono';
import { handle } from '@hono/aws-lambda';
import { cors } from 'hono/cors';
import { reportsRoutes } from '../routes/reports.routes';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/reports', reportsRoutes);
app.route('/reports', reportsRoutes);
app.route('/', reportsRoutes);

export const handler = handle(app);
