import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    login(username, password);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.signalMark}>
        <span style={{ ...styles.ring, animationDelay: '0s' }} />
        <span style={{ ...styles.ring, animationDelay: '0.9s' }} />
        <span style={{ ...styles.ring, animationDelay: '1.8s' }} />
        <span style={styles.dot} />
      </div>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.brandRow}>
          <h1 style={styles.brand}>TESTY <span style={{ color: 'var(--accent-fire)' }}>NETWORKS</span></h1>
          <p style={styles.sub}>Billing Console</p>
        </div>

        <label style={styles.label}>
          Admin username
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    padding: 24,
  },
  signalMark: {
    position: 'relative',
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '1.5px solid var(--accent-blue)',
    animation: 'pulse-ring 2.7s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--accent-blue)',
    boxShadow: '0 0 20px var(--accent-blue)',
  },
  card: {
    width: 360,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    animation: 'fade-up 0.5s ease',
  },
  brandRow: { marginBottom: 8 },
  brand: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' },
  sub: { color: 'var(--text-muted)', fontSize: 13, marginTop: 6 },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  input: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 12px',
    color: 'var(--text)',
    fontSize: 14,
  },
  error: {
    color: 'var(--accent-red)',
    fontSize: 13,
    background: 'var(--accent-red-dim)',
    padding: '8px 10px',
    borderRadius: 8,
  },
  button: {
    marginTop: 8,
    background: 'var(--accent-blue)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
  },
};
