import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mikrotikRoutes from './routes/mikrotik.js';
import mpesaRoutes from './routes/mpesa.js';
import billingRoutes from './routes/billing.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Auth: single admin account, JWT session token ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'testy-networks-billing' }));

// Everything under /api/mikrotik and /api/billing needs the admin JWT.
// /api/mpesa guards its own routes internally (see routes/mpesa.js) because
// /api/mpesa/callback must stay public for Safaricom's servers to reach it.
app.use('/api/mikrotik', requireAuth, mikrotikRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/mpesa', mpesaRoutes);

app.listen(PORT, () => {
  console.log(`Testy Networks billing backend running on port ${PORT}`);
});
