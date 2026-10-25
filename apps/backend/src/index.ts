import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from '@hono/aws-lambda';
import { authRoutes } from './routes/auth.routes';
import { categoriesRoutes } from './routes/categories.routes';
import { productsRoutes } from './routes/products.routes';
import { cartRoutes } from './routes/cart.routes';
import { ordersRoutes } from './routes/orders.routes';
import { paymentsRoutes } from './routes/payments.routes';
import { reportsRoutes } from './routes/reports.routes';
import { uploadsRoutes } from './routes/uploads.routes';
import { usersRoutes } from './routes/users.routes';
import { config } from './config';

export const app = new Hono();

// ── Global CORS Middleware ────────────────────────────
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow local development and deployed frontend origins
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('cloudfront.net') ||
        origin.includes('amazonaws.com')
      ) {
        return origin || '*';
      }
      return origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
  })
);

// ── Health Check ──────────────────────────────────────
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Bakery AWS Lambda Backend',
    database: 'Amazon DynamoDB',
    timestamp: new Date().toISOString(),
  });
});

// ── Mount Sub-Routers ─────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/payments', paymentsRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/uploads', uploadsRoutes);
app.route('/api/users', usersRoutes);

// ── Fallback 404 Route ────────────────────────────────
app.notFound((c) => {
  return c.json({ message: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

// ── Global Error Handler ──────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled Lambda Error:', err);
  return c.json(
    {
      message: err.message || 'Internal Server Error',
      error: process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
    },
    500
  );
});

// ── AWS Lambda Handler Export ─────────────────────────
export const handler = handle(app);

// ── Local Development Server ──────────────────────────
if (process.env['NODE_ENV'] !== 'production' && require.main === module) {
  try {
    const { serve } = require('@hono/node-server');
    const port = Number(process.env['PORT']) || 3000;
    console.log(`🚀 Local Bakery Lambda API running on http://localhost:${port}/api`);
    serve({
      fetch: app.fetch,
      port,
    });
  } catch (e) {
    // @hono/node-server not required on AWS Lambda
  }
}
