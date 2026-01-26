import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) {
            console.error('[AUTH MIDDLEWARE] Token verification failed:', err.message);
            return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }
        
        console.log('[AUTH MIDDLEWARE] Token verified. User:', { id: user.id, role: user.role });
        req.user = user;
        next();
    });
};

export const requireRole = (role: 'doctor' | 'patient') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
        }
        next();
    };
};
