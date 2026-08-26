// backend/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import {
  createUser, findByEmail,
  verifyPassword, safeUser,
} from '../models/user.model.js';

const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, defaultStore = 'local' } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be 6+ characters' });
    if (findByEmail(email))
      return res.status(409).json({ error: 'Email already registered' });

    const user  = await createUser(email, password, defaultStore);
    const token = sign(user);

    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = findByEmail(email);
    if (!user || !(await verifyPassword(user, password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign(user);
    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

// GET /api/auth/me
export function me(req, res) {
  return res.json({ user: req.user });
}
