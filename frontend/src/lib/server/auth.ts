import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract user from Authorization header in NextRequest
 */
export function getUser(req: NextRequest): JwtPayload | null {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return verifyToken(header.split(' ')[1]);
}

/**
 * Require auth — returns user or error Response
 */
export function requireAuth(req: NextRequest): JwtPayload | Response {
  const user = getUser(req);
  if (!user) {
    return Response.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
  }
  return user;
}

/**
 * Require admin role
 */
export function requireAdmin(req: NextRequest): JwtPayload | Response {
  const result = requireAuth(req);
  if (result instanceof Response) return result;
  if (result.role !== 'admin') {
    return Response.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
  }
  return result;
}
