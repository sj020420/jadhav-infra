// Stores the login token in the browser (localStorage). Wrapped in try/catch for private-mode browsers.
const KEY = 'jadhav_infra_token';
export const getToken = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const setToken = (t) => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } };
export const clearToken = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
export const LOGOUT_EVENT = 'jadhav-logout';
