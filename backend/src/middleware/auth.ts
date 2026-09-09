import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function protect(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }

  req.user = decoded;
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
}
