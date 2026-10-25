import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, deleteItem, queryGSI, scanItems } from '../db/dynamodb';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';

export const productsRoutes = new Hono();

export interface ProductEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  isCustomizable: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER';
  isFeatured: boolean;
  isBestSeller: boolean;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: { id: string; type: string; label: string; priceModifier: number }[];
  customizationOptions: {
    id: string;
    type: string;
    label: string;
    isRequired: boolean;
    options: { label: string; value: string; priceModifier?: number }[] | null;
  }[];
  createdAt: string;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ── List Products with Filters & Pagination (Public) ──
productsRoutes.get('/', async (c) => {
  const categoryFilter = c.req.query('category');
  const searchFilter = c.req.query('search')?.toLowerCase().trim();
  const isFeatured = c.req.query('isFeatured');
  const isBestSeller = c.req.query('isBestSeller');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.max(1, parseInt(c.req.query('limit') || '12', 10));

  let products = await queryGSI<ProductEntity>('PRODUCTS');

  // If query returns empty (e.g. before initial indexing), fallback to scan for PRODUCTS
  if (!products || products.length === 0) {
    products = await scanItems<ProductEntity>(
      'begins_with(PK, :prefix)',
      { ':prefix': 'PRODUCT#' }
    );
  }

  // Filter by category slug or id
  if (categoryFilter) {
    products = products.filter(
      (p) =>
        p.categoryId === categoryFilter ||
        p.category?.slug === categoryFilter ||
        p.category?.name?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  // Filter by search query
  if (searchFilter) {
    products = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchFilter) ||
        p.description?.toLowerCase().includes(searchFilter) ||
        p.shortDescription?.toLowerCase().includes(searchFilter)
    );
  }

  // Filter by featured
  if (isFeatured === 'true') {
    products = products.filter((p) => p.isFeatured === true);
  }

  // Filter by best seller
  if (isBestSeller === 'true') {
    products = products.filter((p) => p.isBestSeller === true);
  }

  const total = products.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  return c.json({
    items,
    total,
    page,
    limit,
    totalPages,
  });
});

// ── Get Single Product By Slug or ID (Public) ─────────
productsRoutes.get('/:slugOrId', async (c) => {
  const slugOrId = c.req.param('slugOrId');
  let product = await getItem<ProductEntity>(`PRODUCT#${slugOrId}`, 'METADATA');

  if (!product) {
    const all = await queryGSI<ProductEntity>('PRODUCTS');
    product = all.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
    if (!product) {
      const scanned = await scanItems<ProductEntity>(
        'begins_with(PK, :prefix) AND (slug = :s OR id = :s)',
        { ':prefix': 'PRODUCT#', ':s': slugOrId }
      );
      product = scanned[0] || null;
    }
  }

  if (!product) {
    return c.json({ message: 'Product not found' }, 404);
  }

  return c.json(product);
});

// ── Create Product (Admin Only) ───────────────────────
productsRoutes.post('/', authMiddleware, adminGuard, async (c) => {
  const body = await c.req.json();
  const {
    name,
    description,
    shortDescription,
    basePrice,
    categoryId,
    category,
    images,
    variants,
    customizationOptions,
    isCustomizable,
    stockStatus,
    isFeatured,
    isBestSeller,
  } = body;

  if (!name || basePrice === undefined) {
    return c.json({ message: 'Product name and base price are required' }, 400);
  }

  const id = uuidv4();
  const slug = slugify(name);
  const createdAt = new Date().toISOString();

  const newProduct: ProductEntity = {
    PK: `PRODUCT#${id}`,
    SK: 'METADATA',
    GSI1PK: 'PRODUCTS',
    GSI1SK: `${slug}#${id}`,
    id,
    name,
    slug,
    description: description || '',
    shortDescription: shortDescription || '',
    basePrice: Number(basePrice),
    isCustomizable: !!isCustomizable,
    stockStatus: stockStatus || 'IN_STOCK',
    isFeatured: !!isFeatured,
    isBestSeller: !!isBestSeller,
    categoryId: categoryId || category?.id || '',
    category: category || { id: categoryId, name: '', slug: '' },
    images: images || [],
    variants: variants || [],
    customizationOptions: customizationOptions || [],
    createdAt,
  };

  await putItem(newProduct);
  return c.json(newProduct, 201);
});

// ── Update Product (Admin Only) ───────────────────────
productsRoutes.put('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  const existing = await getItem<ProductEntity>(`PRODUCT#${id}`, 'METADATA');

  if (!existing) {
    return c.json({ message: 'Product not found' }, 404);
  }

  const body = await c.req.json();
  const updated: ProductEntity = {
    ...existing,
    ...body,
    PK: existing.PK,
    SK: existing.SK,
    GSI1PK: 'PRODUCTS',
    id: existing.id,
    basePrice: body.basePrice !== undefined ? Number(body.basePrice) : existing.basePrice,
    slug: body.name ? slugify(body.name) : existing.slug,
  };

  await putItem(updated);
  return c.json(updated);
});

// ── Delete Product (Admin Only) ───────────────────────
productsRoutes.delete('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  await deleteItem(`PRODUCT#${id}`, 'METADATA');
  return c.json({ message: 'Product deleted successfully' });
});
