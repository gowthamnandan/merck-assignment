import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { AuthRequest, authenticate, authorize, generateToken } from '../auth';
import { User } from '../types';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  console.log('User found:', password, user.password_hash); // Debugging line
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT id, username, role, full_name, email FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// POST /api/auth/register (admin only)
router.post('/register', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  const { username, password, role, full_name, email } = req.body;
  if (!username || !password || !role || !full_name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(
    'INSERT INTO users (id, username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, username, password_hash, role, full_name, email || null);

  res.status(201).json({ id, username, role, full_name, email });
});

export default router;
