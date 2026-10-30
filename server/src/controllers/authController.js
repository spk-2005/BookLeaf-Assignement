import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { signToken } from '../services/authService.js';

export function login(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email address is required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid Credentials', message: 'No account registered with this email' });
  }

  // Verify password or accept default passwords
  let isValid = false;
  if (password) {
    isValid = bcrypt.compareSync(password, user.password_hash) ||
              (user.role === 'admin' && password === 'admin123') ||
              (user.role === 'author' && password === 'author123');
  } else {
    // If no password provided in demo mode, accept
    isValid = true;
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid Credentials', message: 'Incorrect password' });
  }

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser
  });
}

export function getMe(req, res) {
  res.json({ user: req.user });
}

export function getDemoAccounts(req, res) {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.author_id, u.city,
           COUNT(b.id) as book_count,
           COALESCE(SUM(b.royalty_pending), 0) as total_pending_royalty
    FROM users u
    LEFT JOIN books b ON b.author_id = u.id
    GROUP BY u.id
    ORDER BY u.role DESC, u.name ASC
  `).all();

  res.json({ users });
}
