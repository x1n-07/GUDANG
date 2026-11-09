import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    companyId?: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'warehouse-app-secret-key-2026', (err: any, user: any) => {
    if (err) {
      // Token invalid/expired => 401 so the client knows to re-authenticate
      res.status(401).json({ message: 'Sesi login telah berakhir, silakan login ulang' });
      return;
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Unauthorized access for this role' });
      return;
    }
    next();
  };
};
