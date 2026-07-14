import { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('testy_token'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/login', { username, password });
      localStorage.setItem('testy_token', data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your connection.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('testy_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, error, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
