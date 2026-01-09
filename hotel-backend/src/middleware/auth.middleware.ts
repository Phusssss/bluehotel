import { Request, Response, NextFunction } from 'express';
import { JwtUtils, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.substring(7);
    const payload = JwtUtils.verifyAccessToken(token);
    
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!roles.includes(user.role)) {
      next(new AppError('Insufficient role permissions', 403));
      return;
    }
    
    next();
  };
};