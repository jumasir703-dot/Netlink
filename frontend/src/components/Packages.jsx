import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { card, pageHeader, pageSub, buttonGhost, input } from './ui.js';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draftPrice, setDraftPrice] = useState('');

  useEffect(() => {
    client.get('/billing/packages').then((res) => setPackages(res.data));
  }, []);

  function startEdit(pkg) {
    setEditingId(pkg.id);
    setDraftPrice(String(pkg.price));
  }

  async function saveEdit(id) {
    const price = Number(draftPrice);
    if (!price || price <= 0) return;
    const { data } = await client.patch(`/billing/packages/${id}`, { price });
    setPackages((prev) => prev.map((p) => (p.id === id ? data : p)));
    setEditingId(null);
  }

  return (
    <div>
      <h2 style={pageHeader}>Packages</h2>
      <p style={pageSub}>Your WiFi pricing tiers. These map directly to hotspot user profiles on the router.</p>

      <div style={styles.grid}>
        {packages.map((pkg) => (
          <div key={pkg.id} style={{ ...card, position: 'relative' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {pkg.label}
            </p>

            {editingId === pkg.id ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  style={{ ...input, width: 90 }}
                  type="number"
                  value={draftPrice}
                  onChange={(e) => setDraftPrice(e.target.value)}
                  autoFocus
                />
                <button style={buttonGhost} onClick={() => saveEdit(pkg.id)}>Save</button>
              </div>
            ) : (
              <p
                style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, marginTop: 8, cursor: 'pointer' }}
                onClick={() => startEdit(pkg)}
                title="Click to edit price"
              >
                Ksh {pkg.price}
              </p>
            )}

            <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 10 }} className="mono">
              limit-uptime: {pkg.durationLimit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 14,
  },
};
