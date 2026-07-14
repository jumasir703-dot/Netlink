import { useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';
import { card, pageHeader, pageSub, table, th, td, buttonDanger, buttonGhost } from './ui.js';

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / 1024 / 1024;
  return mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/mikrotik/active-sessions');
      setSessions(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reach the router.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleDisconnect(id) {
    if (!confirm('Disconnect this device now?')) return;
    await client.delete(`/mikrotik/active-sessions/${id}`);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={pageHeader}>Active Sessions</h2>
          <p style={pageSub}>Devices currently connected to the hotspot, live from the router.</p>
        </div>
        <button onClick={load} style={buttonGhost}>Refresh</button>
      </div>

      <div style={card}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Loading…</p>
        ) : error ? (
          <p style={{ color: 'var(--accent-red)', fontSize: 13.5 }}>{error}</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No devices connected right now.</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>IP Address</th>
                <th style={th}>MAC</th>
                <th style={th}>Uptime</th>
                <th style={th}>Data used</th>
                <th style={th}>Time left</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={td}>{s.user}</td>
                  <td style={{ ...td }} className="mono">{s.address}</td>
                  <td style={{ ...td, color: 'var(--text-muted)' }} className="mono">{s.macAddress}</td>
                  <td style={td}>{s.uptime}</td>
                  <td style={td}>{formatBytes(s.bytesIn + s.bytesOut)}</td>
                  <td style={td}>{s.sessionTimeLeft || '—'}</td>
                  <td style={td}>
                    <button style={buttonDanger} onClick={() => handleDisconnect(s.id)}>
                      Disconnect
                    </button>
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
