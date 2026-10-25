import { Hono } from 'hono';
import { getItem, putItem, deleteItem, scanItems } from '../db/dynamodb';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { UserEntity } from './auth.routes';

export const usersRoutes = new Hono();

// ── Admin: List All Users ─────────────────────────────
usersRoutes.get('/', authMiddleware, adminGuard, async (c) => {
  const users = await scanItems<UserEntity>(
    'begins_with(PK, :prefix)',
    { ':prefix': 'USER#' }
  );

  const safeUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return c.json(safeUsers);
});

// ── Get User By ID ────────────────────────────────────
usersRoutes.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');

  if (currentUser.id !== id && currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
    return c.json({ message: 'Access denied' }, 403);
  }

  const user = await getItem<UserEntity>(`USER#${id}`, 'METADATA');
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// ── Admin: Update User Role/Profile ───────────────────
usersRoutes.put('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const user = await getItem<UserEntity>(`USER#${id}`, 'METADATA');
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  if (body.role) user.role = body.role;
  if (body.name) user.name = body.name;
  if (body.phone) user.phone = body.phone;

  await putItem(user);

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
  });
});

// ── Admin: Delete User ────────────────────────────────
usersRoutes.delete('/:id', authMiddleware, adminGuard, async (c) => {
  const id = c.req.param('id');
  await deleteItem(`USER#${id}`, 'METADATA');
  return c.json({ message: 'User deleted successfully' });
});
