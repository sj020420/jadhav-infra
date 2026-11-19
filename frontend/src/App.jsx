import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useData } from './DataContext.jsx';
import Layout from './components/Layout.jsx';
import { Loader } from './components/ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import JcbWork from './pages/JcbWork.jsx';
import Customers from './pages/Customers.jsx';
import Expenses from './pages/Expenses.jsx';
import Diesel from './pages/Diesel.jsx';
import Employees from './pages/Employees.jsx';
import Reports from './pages/Reports.jsx';
import Invoices, { InvoiceView } from './pages/Invoices.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { loading, error, reload } = useData();
  if (loading) return <Loader text="Loading your data..." />;
  if (error) {
    return (
      <div className="center-box">
        <h2>⚠️ Cannot connect to the server</h2><p>{error}</p>
        <p className="muted">Start the app with <code>npm run dev</code> from the project folder.</p>
        <button className="btn primary big" onClick={reload}>Try again</button>
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="jobs" element={<JcbWork />} />
        <Route path="customers" element={<Customers />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="diesel" element={<Diesel />} />
        <Route path="employees" element={<Employees />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
