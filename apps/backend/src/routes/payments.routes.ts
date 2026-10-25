import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem } from '../db/dynamodb';
import { authMiddleware } from '../middleware/auth.middleware';
import { OrderEntity } from './orders.routes';

export const paymentsRoutes = new Hono();

export interface PaymentEntity {
  PK: string;
  SK: string;
  id: string;
  orderId: string;
  gateway: 'EASYPAISA' | 'JAZZCASH' | 'COD';
  txnRefNo: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

// ── Initiate EasyPaisa ────────────────────────────────
paymentsRoutes.post('/easypaisa/initiate', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { orderId } = body;

  const order = await getItem<OrderEntity>(`ORDER#${orderId}`, 'METADATA');
  if (!order) {
    return c.json({ message: 'Order not found' }, 404);
  }

  const txnRefNo = `EP-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
  const paymentId = uuidv4();

  const payment: PaymentEntity = {
    PK: `PAYMENT#${paymentId}`,
    SK: 'METADATA',
    id: paymentId,
    orderId,
    gateway: 'EASYPAISA',
    txnRefNo,
    amount: order.totalAmount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await putItem(payment);

  const redirectUrl = `https://easypay.easypaisa.com.pk/easypay/Index.jsf?postBackURL=${encodeURIComponent(
    'http://localhost:4200/checkout/processing'
  )}&orderId=${orderId}&amount=${order.totalAmount}&txnRefNo=${txnRefNo}`;

  return c.json({ redirectUrl, txnRefNo });
});

// ── Initiate JazzCash ─────────────────────────────────
paymentsRoutes.post('/jazzcash/initiate', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { orderId } = body;

  const order = await getItem<OrderEntity>(`ORDER#${orderId}`, 'METADATA');
  if (!order) {
    return c.json({ message: 'Order not found' }, 404);
  }

  const txnRefNo = `JC-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
  const paymentId = uuidv4();

  const payment: PaymentEntity = {
    PK: `PAYMENT#${paymentId}`,
    SK: 'METADATA',
    id: paymentId,
    orderId,
    gateway: 'JAZZCASH',
    txnRefNo,
    amount: order.totalAmount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await putItem(payment);

  const postUrl = 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
  const postData = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Amount: String(Math.round(order.totalAmount * 100)),
    pp_TxnRefNo: txnRefNo,
    pp_BillReference: orderId,
    pp_Description: 'Bakery Order Payment',
    pp_ReturnURL: 'http://localhost:4200/checkout/processing',
  };

  return c.json({ postUrl, postData, txnRefNo });
});

// ── Payment Status Callback / Webhook ─────────────────
paymentsRoutes.post('/callback', async (c) => {
  const body = await c.req.json();
  const { orderId, txnRefNo, status } = body;

  if (orderId) {
    const order = await getItem<OrderEntity>(`ORDER#${orderId}`, 'METADATA');
    if (order) {
      if (status === 'SUCCESS' || status === 'PAID' || status === '000') {
        order.paymentStatus = 'PAID';
        order.status = 'CONFIRMED';
      } else {
        order.paymentStatus = 'FAILED';
      }
      order.updatedAt = new Date().toISOString();
      await putItem(order);
    }
  }

  return c.json({ message: 'Callback processed successfully' });
});
