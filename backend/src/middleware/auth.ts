import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email?: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.user = { id: decoded.userId };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

// Alias for consistency
export const authenticateUser = authMiddleware;

// Admin authentication middleware
export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check if token is admin type
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }
    
    (req as any).admin = { id: decoded.userId, role: decoded.role };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
