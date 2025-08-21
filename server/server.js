import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

// In-memory data for demo
let users = [
  { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin' },
  { id: 2, email: 'user@example.com', name: 'User One', role: 'user' }
];

// In-memory credentials (plain for demo)
const credentials = {
  'admin@example.com': { password: 'secret', role: 'admin', name: 'Admin' },
  'user@example.com': { password: 'secret', role: 'user', name: 'User One' }
};

function signToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn });
}

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = auth.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin role required' });
  }
  next();
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptimeSec: process.uptime(), timestamp: new Date().toISOString() });
});

// Auth
app.post('/auth/login', (req, res) => {
  const { email, password, expOverrideSec } = req.body || {};
  const record = credentials[email];
  if (!record || record.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const expiresIn = expOverrideSec ? `${expOverrideSec}s` : JWT_EXPIRES_IN;
  const token = signToken({ email, role: record.role, name: record.name }, expiresIn);
  res.json({ token, token_type: 'Bearer', expires_in: expiresIn });
});

app.post('/auth/refresh', authMiddleware, (req, res) => {
  const { email, role, name } = req.user;
  const token = signToken({ email, role, name });
  res.json({ token, token_type: 'Bearer', expires_in: JWT_EXPIRES_IN });
});

// Users CRUD (protected)
app.get('/users', authMiddleware, (req, res) => {
  res.json(users);
});

app.get('/users/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const u = users.find(x => x.id === id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(u);
});

app.post('/users', authMiddleware, (req, res) => {
  const { email, name, role = 'user' } = req.body || {};
  if (!email || !name) return res.status(400).json({ error: 'Missing email or name' });
  if (users.some(u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = { id, email, name, role };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const { email, name, role } = req.body || {};
  if (email && users.some(u => u.email === email && u.id !== id)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  users[idx] = { ...users[idx], ...(email && { email }), ...(name && { name }), ...(role && { role }) };
  res.json(users[idx]);
});

app.delete('/users/:id', authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const before = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length === before) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
