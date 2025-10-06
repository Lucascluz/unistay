import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export type TokenPayload = 
  | { userId: string; type: 'user' }
  | { userId: string; type: 'company' }
  | { userId: string; type: 'admin'; role: 'admin' | 'super_admin' };

export function generateToken(userId: string, type: 'user' | 'company' = 'user'): string {
  return jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function generateAdminToken(adminId: string, role: 'admin' | 'super_admin' = 'admin'): string {
  return jwt.sign({ userId: adminId, type: 'admin', role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
