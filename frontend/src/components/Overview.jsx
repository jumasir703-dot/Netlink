import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { card, pageHeader, pageSub } from './ui.js';

export default function Overview({ routerStatus }) {
  const [summary, setSummary] = useState(null);
  const [sessionCount, setSessionCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summaryRes, sessionsRes] = await Promise.all([
          client.get('/billing/summary'),
          client.get('/mikrotik/active-sessions').catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          setSummary(summaryRes.data);
          setSessionCount(sessionsRes.data.length);
        }
      } catch {
        // Handled by the empty states below
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h2 style={pageHeader}>Overview</h2>
      <p style={pageSub}>Live standing of your hotspot business.</p>

      <div style={styles.grid}>
        <StatCard label="Revenue today" value={summary ? `Ksh ${summary.todayRevenue}` : '—'} accent="green" />
        <StatCard label="Payments today" value={summary ? summary.todayTransactions : '—'} accent="blue" />
        <StatCard label="Devices online now" value={sessionCount ?? '—'} accent="fire" />
        <StatCard label="Pending payments" value={summary ? summary.pendingTransactions : '—'} accent="neutral" />
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Router health</h3>
        {routerStatus?.online ? (
          <div style={styles.healthGrid}>
            <HealthItem label="Identity" value={routerStatus.identity} />
            <HealthItem label="RouterOS" value={routerStatus.routerosVersion} />
            <HealthItem label="Board" value={routerStatus.boardName} />
            <HealthItem label="Uptime" value={routerStatus.uptime} />
            <HealthItem label="CPU load" value={routerStatus.cpuLoad ? `${routerStatus.cpuLoad}%` : '—'} />
            <HealthItem label="Free memory" value={routerStatus.freeMemory ? `${Math.round(routerStatus.freeMemory / 1024 / 1024)} MB` : '—'} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Can't reach the router right now. Check <span className="mono">MIKROTIK_HOST</span> and that the API service is enabled on port 8728.
          </p>
        )}
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Total lifetime revenue</h3>
        <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {summary ? `Ksh ${summary.totalRevenue.toLocaleString()}` : '—'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {summary ? `${summary.totalTransactions} confirmed M-Pesa payments` : ''}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const colors = {
    green: 'var(--accent-green)',
    blue: 'var(--accent-blue)',
    fire: 'var(--accent-fire)',
    neutral: 'var(--text)',
  };
  return (
    <div style={card}>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: colors[accent], marginTop: 8 }}>
        {value}
      </p>
    </div>
  );
}

function HealthItem({ label, value }) {
  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</p>
      <p style={{ fontSize: 14, marginTop: 3 }}>{value || '—'}</p>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
  },
};
