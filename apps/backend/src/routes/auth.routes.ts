import { Hono } from 'hono';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, queryGSI } from '../db/dynamodb';
import { config } from '../config';
import { authMiddleware, UserPayload } from '../middleware/auth.middleware';

export const authRoutes = new Hono();

export interface UserEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  createdAt: string;
}

function generateToken(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );
}

// ── Customer Registration ──────────────────────────────
authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, name, phone } = body;

  if (!email || !password || !name) {
    return c.json({ message: 'Name, email, and password are required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already registered
  const existingUsers = await queryGSI<UserEntity>(`USER_EMAIL#${normalizedEmail}`);
  if (existingUsers.length > 0) {
    return c.json({ message: 'Email is already registered' }, 409);
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();

  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const newUser: UserEntity = {
    PK: `USER#${id}`,
    SK: 'METADATA',
    GSI1PK: `USER_EMAIL#${normalizedEmail}`,
    GSI1SK: `USER#${id}`,
    id,
    email: normalizedEmail,
    name,
    firstName,
    lastName,
    passwordHash,
    phone: phone || '',
    role: 'CUSTOMER',
    createdAt,
  };

  await putItem(newUser);

  const tokenUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role,
    phone: newUser.phone,
  };

  const accessToken = generateToken(tokenUser);
  return c.json({ accessToken, user: tokenUser }, 201);
});

// ── Customer Login ────────────────────────────────────
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ message: 'Email and password are required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await queryGSI<UserEntity>(`USER_EMAIL#${normalizedEmail}`);
  if (users.length === 0) {
    return c.json({ message: 'Invalid email or password' }, 401);
  }

  const user = users[0];
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return c.json({ message: 'Invalid email or password' }, 401);
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone,
  };

  const accessToken = generateToken(tokenUser);
  return c.json({ accessToken, user: tokenUser });
});

// ── Admin Login ───────────────────────────────────────
authRoutes.post('/admin/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ message: 'Email and password are required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await queryGSI<UserEntity>(`USER_EMAIL#${normalizedEmail}`);
  if (users.length === 0) {
    return c.json({ message: 'Invalid admin credentials' }, 401);
  }

  const user = users[0];
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return c.json({ message: 'Access denied: Admin role required' }, 403);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return c.json({ message: 'Invalid admin credentials' }, 401);
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    firstName: user.firstName || 'Admin',
    lastName: user.lastName || '',
    role: user.role,
    phone: user.phone,
  };

  const accessToken = generateToken(tokenUser);
  return c.json({ accessToken, user: tokenUser });
});

// ── Get Current User ──────────────────────────────────
authRoutes.get('/me', authMiddleware, async (c) => {
  const tokenUser = c.get('user');
  const user = await getItem<UserEntity>(`USER#${tokenUser.id}`, 'METADATA');
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
