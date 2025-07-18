import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ReactPayPage from './ReactPayPage';
import AdminDashboard from './AdminDashboard';
import './main.css';

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
    <div className="home-wrapper">
      <div className="home-card">
        <h1 className="home-title">Welcome to Suiflow</h1>
        <p className="home-description">
          Suiflow is a blockchain-based payment platform. Merchants can create products, generate payment links, and track payments. Customers can pay securely using Suiet Wallet.
        </p>
        {!isLoggedIn ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
            />
            <button type="submit" className="login-button">
              Login to Admin Dashboard
            </button>
            {error && <div className="error-text">{error}</div>}
          </form>
        ) : (
          <button onClick={() => navigate('/admin/dashboard')} className="login-button">
            Go to Admin Dashboard
          </button>
        )}
        <div className="how-it-works">
          <b>How it works:</b>
          <ul className="how-it-works-list">
            <li>Admins can add products and generate payment links.</li>
            <li>Customers pay using Suiet Wallet via the payment link.</li>
            <li>Payments are auto-verified on-chain and tracked in the dashboard.</li>
            <li>Embed Suiflow checkout on any site using the JS SDK.</li>
          </ul>
        </div>
        <div className="help-text">
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
