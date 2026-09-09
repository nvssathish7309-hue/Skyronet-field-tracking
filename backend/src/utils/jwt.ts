import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fieldtrack_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
