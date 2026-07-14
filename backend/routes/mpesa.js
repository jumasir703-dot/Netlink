import express from 'express';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import mpesa from '../services/mpesaService.js';
import mikrotik from '../services/mikrotikService.js';
import { Packages, Transactions } from '../services/store.js';

const router = express.Router();

// Local auth guard - applied only to the routes below that need it.
// /callback is intentionally left unguarded: Safaricom's servers call it
// directly with no auth header.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Normalizes Kenyan numbers (07..., +2547..., 2547...) to Daraja's required 2547XXXXXXXX format */
function normalizePhone(phone) {
  let p = phone.replace(/\s+/g, '').replace('+', '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
  return p;
}

// Kick off an STK push for a chosen package
router.post('/stk-push', requireAuth, async (req, res) => {
  try {
    const { phone, packageId, hotspotUsername } = req.body;
    if (!phone || !packageId) {
      return res.status(400).json({ error: 'phone and packageId are required' });
    }

    const pkg = Packages.getById(packageId);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const normalizedPhone = normalizePhone(phone);
    const username = hotspotUsername || normalizedPhone;

    const response = await mpesa.stkPush({
      phone: normalizedPhone,
      amount: pkg.price,
      accountReference: username,
      transactionDesc: `Testy Networks - ${pkg.label}`,
    });

    Transactions.add({
      id: nanoid(),
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      phone: normalizedPhone,
      hotspotUsername: username,
      packageId: pkg.id,
      packageLabel: pkg.label,
      durationLimit: pkg.durationLimit,
      amount: pkg.price,
      status: 'PENDING',
      createdAt: Date.now(),
    });

    res.json({
      message: 'STK push sent. Ask the customer to check their phone.',
      checkoutRequestId: response.CheckoutRequestID,
    });
  } catch (err) {
    const detail = err.response?.data || err.message;
    res.status(502).json({ error: 'STK push failed', detail });
  }
});

// Safaricom hits this URL asynchronously once the customer completes (or cancels) the prompt
router.post('/callback', async (req, res) => {
  const parsed = mpesa.parseCallback(req.body);

  // Always acknowledge receipt to Safaricom, even on our own processing errors,
  // otherwise Safaricom will keep retrying the callback.
  if (!parsed) {
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  try {
    const tx = Transactions.findByCheckoutId(parsed.checkoutRequestId);

    if (!parsed.success) {
      Transactions.updateByCheckoutId(parsed.checkoutRequestId, {
        status: 'FAILED',
        resultDesc: parsed.resultDesc,
      });
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    Transactions.updateByCheckoutId(parsed.checkoutRequestId, {
      status: 'SUCCESS',
      mpesaReceiptNumber: parsed.mpesaReceiptNumber,
      confirmedAmount: parsed.amount,
      confirmedAt: Date.now(),
    });

    // Payment confirmed - provision the hotspot user on the router automatically
    if (tx) {
      await mikrotik.createHotspotUser({
        username: tx.hotspotUsername,
        password: tx.hotspotUsername,
        durationLimit: tx.durationLimit,
        comment: `Paid via M-Pesa ${parsed.mpesaReceiptNumber}`,
      });
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    // Still acknowledge Safaricom - log the provisioning failure for manual follow-up
    console.error('Callback processing error:', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// Frontend polls this while waiting for the callback to land
router.get('/status/:checkoutRequestId', requireAuth, async (req, res) => {
  const tx = Transactions.findByCheckoutId(req.params.checkoutRequestId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  if (tx.status === 'PENDING') {
    try {
      const queryResult = await mpesa.stkPushQuery(req.params.checkoutRequestId);
      if (queryResult.ResultCode === '0') {
        // Query confirms success but callback hasn't landed yet - the callback
        // route will do the actual provisioning once it arrives.
        return res.json({ ...tx, liveStatus: 'CONFIRMING' });
      }
    } catch {
      // Query can fail while still pending on Safaricom's side - ignore and return current state
    }
  }

  res.json(tx);
});

export default router;
