import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import client from './api/client.js';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Overview from './components/Overview.jsx';
import ActiveSessions from './components/ActiveSessions.jsx';
import Packages from './components/Packages.jsx';
import BillingPanel from './components/BillingPanel.jsx';

function Dashboard() {
  const { logout } = useAuth();
  const [view, setView] = useState('overview');
  const [routerStatus, setRouterStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { data } = await client.get('/mikrotik/status');
        if (!cancelled) setRouterStatus(data);
      } catch {
        if (!cancelled) setRouterStatus({ online: false });
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active={view} onNavigate={setView} onLogout={logout} routerOnline={routerStatus?.online} />
      <main style={{ flex: 1, padding: '28px 36px', maxWidth: 1100 }}>
        {view === 'overview' && <Overview routerStatus={routerStatus} />}
        {view === 'sessions' && <ActiveSessions />}
        {view === 'packages' && <Packages />}
        {view === 'billing' && <BillingPanel />}
      </main>
    </div>
  );
}

function Shell() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
