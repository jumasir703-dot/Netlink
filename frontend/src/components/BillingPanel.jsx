import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { card, pageHeader, pageSub, table, th, td, badge, button, input } from './ui.js';

export default function BillingPanel() {
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  async function loadTransactions() {
    const { data } = await client.get('/billing/transactions');
    setTransactions(data);
  }

  useEffect(() => {
    client.get('/billing/packages').then((res) => {
      setPackages(res.data);
      setPackageId(res.data[0]?.id || '');
    });
    loadTransactions();
    const interval = setInterval(loadTransactions, 6000);
    return () => clearInterval(interval);
  }, []);

  async function handleStkPush(e) {
    e.preventDefault();
    if (!phone || !packageId) return;
    setSending(true);
    setStatusMsg('');
    try {
      const { data } = await client.post('/mpesa/stk-push', { phone, packageId });
      setStatusMsg(`STK push sent — ${data.checkoutRequestId}. Waiting for customer to complete on their phone.`);
      setPhone('');
      loadTransactions();
    } catch (err) {
      setStatusMsg(err.response?.data?.error || 'STK push failed. Check M-Pesa credentials in .env.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2 style={pageHeader}>Billing & M-Pesa</h2>
      <p style={pageSub}>Trigger an STK push for a walk-in customer, or review payment history.</p>

      <div style={{ ...card, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Charge a customer</h3>
        <form onSubmit={handleStkPush} style={styles.form}>
          <label style={styles.label}>
            Phone number
            <input
              style={input}
              placeholder="0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>

          <label style={styles.label}>
            Package
            <select style={{ ...input }} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — Ksh {p.price}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={sending} style={{ ...button, alignSelf: 'flex-end' }}>
            {sending ? 'Sending…' : 'Send STK Push'}
          </button>
        </form>
        {statusMsg && <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{statusMsg}</p>}
      </div>

      <div style={card}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Recent transactions</h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No payments yet.</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Time</th>
                <th style={th}>Phone</th>
                <th style={th}>Package</th>
                <th style={th}>Amount</th>
                <th style={th}>Receipt</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td style={td}>{new Date(t.createdAt).toLocaleString()}</td>
                  <td style={td} className="mono">{t.phone}</td>
                  <td style={td}>{t.packageLabel}</td>
                  <td style={td}>Ksh {t.amount}</td>
                  <td style={td} className="mono">{t.mpesaReceiptNumber || '—'}</td>
                  <td style={td}>
                    <span style={badge(t.status === 'SUCCESS' ? 'success' : t.status === 'FAILED' ? 'failed' : 'pending')}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: 14,
    alignItems: 'end',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
};
