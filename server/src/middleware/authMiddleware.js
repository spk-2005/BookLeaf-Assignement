import { verifyJwt } from '../services/authService.js';
import { db } from '../db/database.js';

export function requireAuth(req, res, next) {
  // Support Bearer header or ?token= for SSE stream
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Missing Bearer token in Authorization header or query parameter'
    });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Invalid or Expired Token',
      message: 'Please log in again'
    });
  }

  // Lookup fresh user record
  const user = db.prepare('SELECT id, name, email, role, author_id, phone, city FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({
      error: 'User Not Found',
      message: 'The account associated with this token no longer exists'
    });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to BookLeaf administrative staff only'
    });
  }
  next();
}

export function requireAuthor(req, res, next) {
  if (!req.user || req.user.role !== 'author') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to authors only'
    });
  }
  next();
}
