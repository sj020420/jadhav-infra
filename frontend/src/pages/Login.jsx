import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setErr('Enter username and password'); return; }
    setBusy(true); setErr('');
    try {
      await onLogin(username.trim(), password);
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🚜</div>
        <h1>JADHAV INFRA</h1>
        <p className="muted">JCB Rental Manager – Login</p>

        <label className="login-field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
          />
        </label>

        <label className="login-field">
          <span>Password</span>
          <div className="login-pass">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show or hide password">
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </label>

        {err && <div className="login-err" role="alert">⚠️ {err}</div>}

        <button className="btn primary big" type="submit" disabled={busy}>
          {busy ? 'Logging in… (server may take a minute to wake up)' : 'Login'}
        </button>
      </form>
    </div>
  );
}
