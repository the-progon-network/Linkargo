import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('linkargo_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [toast, setToast] = useState(null);

  const login = useCallback((userData) => {
    localStorage.setItem('linkargo_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('linkargo_user');
    localStorage.removeItem('linkargo_token');
    setUser(null);
  }, []);

  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('linkargo_token');
  }, []);

  const setToken = useCallback((token) => {
    localStorage.setItem('linkargo_token', token);
  }, []);

  return (
    <AppContext.Provider value={{ user, login, logout, showToast, getToken, setToken }}>
      {children}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
