import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  return token || null;
}

const AuthMiddleware = {
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ message: 'JWT_SECRET is not configured' });
      }

      const payload = jwt.verify(token, secret);
      if (
        typeof payload === 'string' ||
        payload.sub === undefined ||
        typeof payload.email !== 'string' ||
        (payload.role !== 'CUSTOMER' && payload.role !== 'ORGANIZER')
      ) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const id = Number(payload.sub);
      if (Number.isNaN(id)) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = {
        id,
        email: payload.email,
        role: payload.role as UserRole,
      };
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  },

  /**
   * Use after authMiddleware. Allows only users with one of the given roles.
   */
  requireRole: (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'Forbidden: insufficient permissions',
        });
      }

      next();
    };
  },
};

export default AuthMiddleware;
