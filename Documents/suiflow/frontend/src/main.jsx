import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ReactPayPage from './ReactPayPage';
import AdminDashboard from './AdminDashboard';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('adminLoggedIn') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem('adminLoggedIn', 'true');
      setIsLoggedIn(true);
      setError('');
      navigate('/admin/dashboard');
    } else {
      setError('Please enter email and password.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Welcome to Suiflow</h1>
        <p style={{ textAlign: 'center', marginBottom: 24 }}>
          Suiflow is a blockchain-based payment platform. Merchants can create products, generate payment links, and track payments. Customers can pay securely using Suiet Wallet.
        </p>
        {!isLoggedIn ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', padding: 10, borderRadius: 4, border: 'none', fontWeight: 'bold' }}>
              Login to Admin Dashboard
            </button>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </form>
        ) : (
          <button onClick={() => navigate('/admin/dashboard')} style={{ width: '100%', background: '#2563eb', color: '#fff', padding: 10, borderRadius: 4, border: 'none', fontWeight: 'bold' }}>
            Go to Admin Dashboard
          </button>
        )}
        <div style={{ marginTop: 32, fontSize: 14, color: '#555' }}>
          <b>How it works:</b>
          <ul style={{ margin: '12px 0 0 18px', padding: 0 }}>
            <li>Admins can add products and generate payment links.</li>
            <li>Customers pay using Suiet Wallet via the payment link.</li>
            <li>Payments are auto-verified on-chain and tracked in the dashboard.</li>
            <li>Embed Suiflow checkout on any site using the JS SDK.</li>
          </ul>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: '#888', textAlign: 'center' }}>
          Need help? See the <a href="/docs/api-docs.md" target="_blank" rel="noopener noreferrer">API Docs</a> or contact support.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/react-pay/:productId" element={<ReactPayPage />} />
      <Route path="/pay/:productId" element={<ReactPayPage />} />
    </Routes>
  </BrowserRouter>
);