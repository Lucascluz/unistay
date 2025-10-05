import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string, type: 'user' | 'company' = 'user'): string {
  return jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyToken(token: string): { userId: string; type: 'user' | 'company' } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; type: 'user' | 'company' };
}
