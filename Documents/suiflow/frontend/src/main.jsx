import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ReactPayPage from './ReactPayPage';
import AdminDashboard from './AdminDashboard';
import AuthWrapper from './components/AuthWrapper';
import authService from './services/authService';
import './main.css';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getProfile();
          setIsAuthenticated(true);
          navigate('/admin/dashboard');
        } catch (error) {
          // Token is invalid, clear it
          authService.logout();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleAuthSuccess = (result) => {
    setIsAuthenticated(true);
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="home-wrapper">
        <div className="home-card">
          <h1 className="home-title">Welcome to Suiflow</h1>
          <p>You are logged in. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <AuthWrapper onAuthSuccess={handleAuthSuccess} />;
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
