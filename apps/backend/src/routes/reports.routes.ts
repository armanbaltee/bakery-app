import { Hono } from 'hono';
import { scanItems } from '../db/dynamodb';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { OrderEntity } from './orders.routes';
import { ProductEntity } from './products.routes';
import { UserEntity } from './auth.routes';

export const reportsRoutes = new Hono();

// ── Admin Dashboard Statistics ────────────────────────
reportsRoutes.get('/dashboard', authMiddleware, adminGuard, async (c) => {
  // Query orders, products, and users
  const orders = await scanItems<OrderEntity>(
    'begins_with(PK, :prefix)',
    { ':prefix': 'ORDER#' }
  );

  const products = await scanItems<ProductEntity>(
    'begins_with(PK, :prefix)',
    { ':prefix': 'PRODUCT#' }
  );

  const users = await scanItems<UserEntity>(
    'begins_with(PK, :prefix) AND #r = :role',
    { ':prefix': 'USER#', ':role': 'CUSTOMER' },
    { '#r': 'role' }
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalProducts = products.length;
  const totalCustomers = users.length;

  // Sort orders descending by createdAt and get the 5 most recent
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    user: o.user,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    status: o.status,
    createdAt: o.createdAt,
  }));

  return c.json({
    totalOrders,
    pendingOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    recentOrders,
  });
});
