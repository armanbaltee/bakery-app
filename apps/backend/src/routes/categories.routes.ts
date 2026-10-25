import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, deleteItem, queryGSI } from '../db/dynamodb';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';

export const categoriesRoutes = new Hono();

export interface CategoryEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
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

// ── List Categories (Public) ──────────────────────────
categoriesRoutes.get('/', async (c) => {
  const items = await queryGSI<CategoryEntity>('CATEGORIES');
  // Sort by displayOrder ascending
  items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const result = items.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    displayOrder: cat.displayOrder,
  }));

  return c.json(result);
});

// ── Get Category By ID or Slug (Public) ───────────────
categoriesRoutes.get('/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug');
  let category = await getItem<CategoryEntity>(`CATEGORY#${idOrSlug}`, 'METADATA');

  if (!category) {
    const all = await queryGSI<CategoryEntity>('CATEGORIES');
    category = all.find((cat) => cat.slug === idOrSlug || cat.id === idOrSlug) || null;
  }

  if (!category) {
    return c.json({ message: 'Category not found' }, 404);
  }

  return c.json({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
  });
});

// ── Create Category (Admin Only) ──────────────────────
categoriesRoutes.post('/', authMiddleware, adminGuard, async (c) => {
  const body = await c.req.json();
  const { name, description, imageUrl, displayOrder } = body;

  if (!name) {
    return c.json({ message: 'Category name is required' }, 400);
  }

  const id = uuidv4();
  const slug = slugify(name);
  const order = typeof displayOrder === 'number' ? displayOrder : 0;
  const createdAt = new Date().toISOString();

  const newCategory: CategoryEntity = {
    PK: `CATEGORY#${id}`,
    SK: 'METADATA',
    GSI1PK: 'CATEGORIES',
    GSI1SK: `${String(order).padStart(4, '0')}#${slug}`,
    id,
    name,
    slug,
    description: description || '',
    imageUrl: imageUrl || '',
    displayOrder: order,
    createdAt,
  };

  await putItem(newCategory);
  return c.json(newCategory, 201);
});

// ── Update Category (Admin Only) ──────────────────────
categoriesRoutes.put('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  const existing = await getItem<CategoryEntity>(`CATEGORY#${id}`, 'METADATA');

  if (!existing) {
    return c.json({ message: 'Category not found' }, 404);
  }

  const body = await c.req.json();
  const updated: CategoryEntity = {
    ...existing,
    name: body.name || existing.name,
    slug: body.name ? slugify(body.name) : existing.slug,
    description: body.description !== undefined ? body.description : existing.description,
    imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
    displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
  };

  await putItem(updated);
  return c.json(updated);
});

// ── Delete Category (Admin Only) ──────────────────────
categoriesRoutes.delete('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  await deleteItem(`CATEGORY#${id}`, 'METADATA');
  return c.json({ message: 'Category deleted successfully' });
});
