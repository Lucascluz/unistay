import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN: StringValue = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
