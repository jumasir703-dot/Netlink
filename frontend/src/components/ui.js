export const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: 22,
};

export const pageHeader = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 4,
};

export const pageSub = {
  color: 'var(--text-muted)',
  fontSize: 14,
  marginBottom: 24,
};

export const table = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13.5,
};

export const th = {
  textAlign: 'left',
  color: 'var(--text-muted)',
  fontWeight: 500,
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const td = {
  padding: '12px 12px',
  borderBottom: '1px solid var(--border)',
};

export function badge(kind) {
  const map = {
    success: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
    pending: { bg: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' },
    failed: { bg: 'var(--accent-red-dim)', color: 'var(--accent-red)' },
    neutral: { bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
  };
  const c = map[kind] || map.neutral;
  return {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: c.bg,
    color: c.color,
  };
}

export const button = {
  background: 'var(--accent-blue)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 16px',
  fontSize: 13.5,
  fontWeight: 600,
};

export const buttonGhost = {
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '9px 14px',
  fontSize: 13.5,
};

export const buttonDanger = {
  background: 'var(--accent-red-dim)',
  color: 'var(--accent-red)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '7px 12px',
  fontSize: 12.5,
  fontWeight: 600,
};

export const input = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
};
