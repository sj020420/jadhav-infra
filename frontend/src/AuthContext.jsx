import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { clearToken, getToken, LOGOUT_EVENT, setToken } from './auth.js';
import Login from './pages/Login.jsx';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(!!getToken());

  const logout = useCallback(() => { clearToken(); setAuthed(false); }, []);
  const login = useCallback(async (username, password) => {
    const r = await api.login(username, password);
    setToken(r.token);
    setAuthed(true);
  }, []);

  // api.js fires this when the server says the token is missing/expired
  useEffect(() => {
    window.addEventListener(LOGOUT_EVENT, logout);
    return () => window.removeEventListener(LOGOUT_EVENT, logout);
  }, [logout]);

  if (!authed) return <Login onLogin={login} />;
  return <Ctx.Provider value={{ logout }}>{children}</Ctx.Provider>;
}
