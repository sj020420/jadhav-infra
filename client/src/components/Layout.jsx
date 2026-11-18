import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  ['/', 'Dashboard', '📊'],
  ['/jobs', 'JCB Work', '🚜'],
  ['/customers', 'Customers', '👥'],
  ['/expenses', 'Expenses', '🧾'],
  ['/diesel', 'Diesel', '⛽'],
  ['/employees', 'Driver & Staff', '👷'],
  ['/reports', 'Reports', '📈'],
  ['/invoices', 'Invoices', '📄'],
  ['/settings', 'Settings', '⚙️'],
];

const BOTTOM = [0, 1, 2, 3];

export default function Layout() {
  const [more, setMore] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => setMore(false), [loc.pathname]);

  const link = ([to, label, ico]) => (
    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span className="ico">{ico}</span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="app">
      {/* Desktop Sidebar */}
      <aside className="sidebar no-print">
        <div className="brand">
          <span>🚜 JADHAV INFRA</span>
          <small>JCB Rental Manager</small>
        </div>
        <nav>{NAV.map(link)}</nav>
      </aside>

      {/* Mobile Sticky Topbar */}
      <header className="topbar no-print">
        <div className="topbar-brand">
          <span className="brand-logo">🚜</span>
          <div>
            <div className="brand-name">JADHAV INFRA</div>
            <span className="brand-badge">JCB Manager</span>
          </div>
        </div>
        <button className="topbar-add-btn" onClick={() => nav('/jobs?new=1')} aria-label="Add JCB Work">
          <span>+</span> Add Work
        </button>
      </header>

      {/* Main Content Area */}
      <main className="main">
        <Outlet />
      </main>

      {/* Mobile Floating Action Button */}
      <button className="fab no-print" onClick={() => nav('/jobs?new=1')} aria-label="Add New JCB Work">
        <span className="fab-plus">+</span>
        <span>Add JCB Work</span>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="bottomnav no-print">
        {BOTTOM.map((i) => link(NAV[i]))}
        <button
          type="button"
          onClick={() => setMore(true)}
          className={more ? 'active' : ''}
          aria-label="More Menu"
        >
          <span className="ico">☰</span>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Action Sheet Drawer */}
      {more && (
        <div className="drawer-back" onClick={() => setMore(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="drawer-head">
              <b>All Sections</b>
              <button className="x" onClick={() => setMore(false)} aria-label="Close">✕</button>
            </div>
            <div className="drawer-grid">
              {NAV.map(link)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
