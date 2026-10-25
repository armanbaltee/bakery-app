import { Context, Next } from 'hono';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';

export interface UserPayload {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  name?: string;
  firstName?: string;
  lastName?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: UserPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized: missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as UserPayload;
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ message: 'Unauthorized: invalid or expired token' }, 401);
  }
}

export async function adminGuard(c: Context, next: Next) {
  const user = c.get('user');
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return c.json({ message: 'Forbidden: Admin access required' }, 403);
  }
  await next();
}
