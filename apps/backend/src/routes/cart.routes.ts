import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem } from '../db/dynamodb';
import { authMiddleware } from '../middleware/auth.middleware';
import { ProductEntity } from './products.routes';

export const cartRoutes = new Hono();

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customMessage?: string;
  customEggless?: boolean;
  selectedVariant?: { id: string; label: string; priceModifier: number };
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string }[];
  };
}

export interface CartEntity {
  PK: string;
  SK: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: string;
}

function calculateCartTotals(items: CartItem[]) {
  let totalAmount = 0;
  for (const item of items) {
    item.totalPrice = item.unitPrice * item.quantity;
    totalAmount += item.totalPrice;
  }
  return totalAmount;
}

// ── Get Cart ──────────────────────────────────────────
cartRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  let cart = await getItem<CartEntity>(`CART#${user.id}`, 'METADATA');

  if (!cart) {
    cart = {
      PK: `CART#${user.id}`,
      SK: 'METADATA',
      userId: user.id,
      items: [],
      totalAmount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return c.json(cart);
});

// ── Add Item to Cart ──────────────────────────────────
cartRoutes.post('/items', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { productId, quantity = 1, variantId, customMessage, customEggless } = body;

  if (!productId) {
    return c.json({ message: 'productId is required' }, 400);
  }

  // Fetch product to get accurate pricing and details
  const product = await getItem<ProductEntity>(`PRODUCT#${productId}`, 'METADATA');
  if (!product) {
    return c.json({ message: 'Product not found' }, 404);
  }

  let cart = await getItem<CartEntity>(`CART#${user.id}`, 'METADATA');
  if (!cart) {
    cart = {
      PK: `CART#${user.id}`,
      SK: 'METADATA',
      userId: user.id,
      items: [],
      totalAmount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  let unitPrice = product.basePrice;
  let selectedVariant = undefined;
  if (variantId && product.variants?.length) {
    selectedVariant = product.variants.find((v) => v.id === variantId);
    if (selectedVariant) {
      unitPrice += selectedVariant.priceModifier || 0;
    }
  }

  // Check if item already exists in cart with same configurations
  const existingIdx = cart.items.findIndex(
    (item) =>
      item.productId === productId &&
      item.selectedVariant?.id === variantId &&
      item.customMessage === customMessage
  );

  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += quantity;
    cart.items[existingIdx].unitPrice = unitPrice;
    cart.items[existingIdx].totalPrice = cart.items[existingIdx].quantity * unitPrice;
  } else {
    const newItem: CartItem = {
      id: uuidv4(),
      productId,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      customMessage: customMessage || '',
      customEggless: !!customEggless,
      selectedVariant,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        images: product.images || [],
      },
    };
    cart.items.push(newItem);
  }

  cart.totalAmount = calculateCartTotals(cart.items);
  cart.updatedAt = new Date().toISOString();

  await putItem(cart);
  return c.json(cart, 201);
});

// ── Update Cart Item Quantity ─────────────────────────
cartRoutes.put('/items/:itemId', authMiddleware, async (c) => {
  const user = c.get('user');
  const itemId = c.req.param('itemId');
  const body = await c.req.json();
  const quantity = Math.max(1, parseInt(body.quantity || '1', 10));

  let cart = await getItem<CartEntity>(`CART#${user.id}`, 'METADATA');
  if (!cart) {
    return c.json({ message: 'Cart not found' }, 404);
  }

  const item = cart.items.find((i) => i.id === itemId);
  if (!item) {
    return c.json({ message: 'Cart item not found' }, 404);
  }

  item.quantity = quantity;
  cart.totalAmount = calculateCartTotals(cart.items);
  cart.updatedAt = new Date().toISOString();

  await putItem(cart);
  return c.json(cart);
});

// ── Delete Cart Item ──────────────────────────────────
cartRoutes.delete('/items/:itemId', authMiddleware, async (c) => {
  const user = c.get('user');
  const itemId = c.req.param('itemId');

  let cart = await getItem<CartEntity>(`CART#${user.id}`, 'METADATA');
  if (!cart) {
    return c.json({ message: 'Cart not found' }, 404);
  }

  cart.items = cart.items.filter((i) => i.id !== itemId);
  cart.totalAmount = calculateCartTotals(cart.items);
  cart.updatedAt = new Date().toISOString();

  await putItem(cart);
  return c.json(cart);
});

// ── Clear Cart ────────────────────────────────────────
cartRoutes.delete('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const emptyCart: CartEntity = {
    PK: `CART#${user.id}`,
    SK: 'METADATA',
    userId: user.id,
    items: [],
    totalAmount: 0,
    updatedAt: new Date().toISOString(),
  };

  await putItem(emptyCart);
  return c.json(emptyCart);
});
