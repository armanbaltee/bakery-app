import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, queryGSI, scanItems } from '../db/dynamodb';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { CartEntity } from './cart.routes';

export const ordersRoutes = new Hono();

export interface OrderEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: any[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode?: string;
    notes?: string;
  };
  paymentMethod: 'COD' | 'EASYPAISA' | 'JAZZCASH';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// ── Place Order (Customer) ────────────────────────────
ordersRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { shippingAddress, paymentMethod = 'COD', items: directItems, notes } = body;

  let orderItems = directItems;
  let totalAmount = 0;

  // If items not sent directly, pull from user's cart
  if (!orderItems || orderItems.length === 0) {
    const cart = await getItem<CartEntity>(`CART#${user.id}`, 'METADATA');
    if (!cart || cart.items.length === 0) {
      return c.json({ message: 'Cart is empty. Please add items to place an order.' }, 400);
    }
    orderItems = cart.items.map((i) => ({
      productId: i.productId,
      productName: i.product?.name || 'Bakery Item',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      customMessage: i.customMessage,
      customEggless: i.customEggless,
      selectedVariant: i.selectedVariant,
      imageUrl: i.product?.images?.[0]?.url,
    }));
    totalAmount = cart.totalAmount;

    // Clear cart after creating order
    await putItem<CartEntity>({
      PK: `CART#${user.id}`,
      SK: 'METADATA',
      userId: user.id,
      items: [],
      totalAmount: 0,
      updatedAt: new Date().toISOString(),
    });
  } else {
    totalAmount = orderItems.reduce(
      (sum: number, item: any) => sum + (item.totalPrice || item.unitPrice * item.quantity),
      0
    );
  }

  const orderId = uuidv4();
  const now = new Date().toISOString();

  const newOrder: OrderEntity = {
    PK: `ORDER#${orderId}`,
    SK: 'METADATA',
    GSI1PK: `USER_ORDERS#${user.id}`,
    GSI1SK: `${now}#${orderId}`,
    id: orderId,
    userId: user.id,
    user: {
      id: user.id,
      firstName: user.firstName || user.name?.split(' ')[0] || 'Customer',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || shippingAddress?.phone || '',
    },
    items: orderItems,
    totalAmount,
    shippingAddress: {
      fullName: shippingAddress?.fullName || user.name || 'Valued Customer',
      phone: shippingAddress?.phone || user.phone || '',
      street: shippingAddress?.street || shippingAddress?.address || 'Standard Delivery',
      city: shippingAddress?.city || 'Karachi',
      postalCode: shippingAddress?.postalCode || '',
      notes: notes || shippingAddress?.notes || '',
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  await putItem(newOrder);
  return c.json(newOrder, 201);
});

// ── Customer Order History ────────────────────────────
ordersRoutes.get('/my-orders', authMiddleware, async (c) => {
  const user = c.get('user');
  const orders = await queryGSI<OrderEntity>(`USER_ORDERS#${user.id}`);
  // Sort descending by date
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json(orders);
});

// ── Get Single Order Detail ───────────────────────────
ordersRoutes.get('/:id', authMiddleware, async (c) => {
  const orderId = c.req.param('id');
  const order = await getItem<OrderEntity>(`ORDER#${orderId}`, 'METADATA');

  if (!order) {
    return c.json({ message: 'Order not found' }, 404);
  }

  const currentUser = c.get('user');
  // Only the owner or admin/staff can view the order
  if (
    order.userId !== currentUser.id &&
    currentUser.role !== 'ADMIN' &&
    currentUser.role !== 'STAFF'
  ) {
    return c.json({ message: 'Access denied' }, 403);
  }

  return c.json(order);
});

// ── Admin: List All Orders ────────────────────────────
ordersRoutes.get('/', authMiddleware, adminGuard, async (c) => {
  const statusFilter = c.req.query('status');
  const limit = Math.max(1, parseInt(c.req.query('limit') || '50', 10));

  let orders = await scanItems<OrderEntity>(
    'begins_with(PK, :prefix)',
    { ':prefix': 'ORDER#' }
  );

  if (statusFilter) {
    orders = orders.filter((o) => o.status === statusFilter);
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json(orders.slice(0, limit));
});

// ── Admin: Update Order Status ────────────────────────
ordersRoutes.patch('/:id/status', authMiddleware, adminGuard, async (c) => {
  const orderId = c.req.param('id');
  const body = await c.req.json();
  const { status, paymentStatus } = body;

  const order = await getItem<OrderEntity>(`ORDER#${orderId}`, 'METADATA');
  if (!order) {
    return c.json({ message: 'Order not found' }, 404);
  }

  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();

  await putItem(order);
  return c.json(order);
});
