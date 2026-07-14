const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Active Sessions' },
  { id: 'packages', label: 'Packages' },
  { id: 'billing', label: 'Billing & M-Pesa' },
];

export default function Sidebar({ active, onNavigate, onLogout, routerOnline }) {
  return (
    <aside style={styles.sidebar}>
      <div>
        <div style={styles.brand}>
          TESTY <span style={{ color: 'var(--accent-fire)' }}>NETWORKS</span>
        </div>
        <div style={styles.brandSub}>Billing Console</div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                ...styles.navItem,
                ...(active === item.id ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <div style={styles.statusRow}>
          <span
            style={{
              ...styles.statusDot,
              background: routerOnline ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: routerOnline ? '0 0 8px var(--accent-green)' : 'none',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Router {routerOnline ? 'online' : 'unreachable'}
          </span>
        </div>
        <button onClick={onLogout} style={styles.logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    borderRight: '1px solid var(--border)',
    padding: '28px 18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  brand: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 },
  brandSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 28 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: 'var(--surface-raised)',
    color: 'var(--text)',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 },
  statusDot: { width: 7, height: 7, borderRadius: '50%' },
  logout: {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    padding: '9px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
  },
};
