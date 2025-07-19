import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import './services/AdminDashboard.css';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [merchant, setMerchant] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    priceInSui: '',
    merchantAddress: '',
    description: '',
    redirectURL: ''
  });
  const [loading, setLoading] = useState(false);
  const [productError, setProductError] = useState('');
  const [copied, setCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    try {
      const profileData = await authService.getProfile();
      setMerchant(profileData.merchant);
      await fetchData();
    } catch (error) {
      console.error('Authentication failed:', error);
      authService.logout();
      navigate('/');
    } finally {
      setAuthLoading(false);
    }
  }

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  useEffect(() => {
    if (merchant) {
      fetchData();
    }
  }, [merchant]);

  async function fetchData() {
    if (!merchant) return;
    await Promise.all([fetchProducts(), fetchPayments()]);
  }

  async function fetchProducts() {
    try {
      const token = authService.getToken();
      const res = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async function fetchPayments() {
    try {
      const token = authService.getToken();
      const res = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    setLoading(true);
    setProductError('');
    try {
      const token = authService.getToken();
      const productData = {
        ...newProduct,
        priceInSui: parseFloat(newProduct.priceInSui), // Ensure it's a number
        merchantAddress: merchant.walletAddress // Use authenticated merchant's wallet
      };
      
      // Validate price
      if (isNaN(productData.priceInSui) || productData.priceInSui <= 0) {
        setProductError('Please enter a valid price greater than 0');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        setProductError(data.message || 'Failed to add product.');
        setLoading(false);
        return;
      }
      
      setNewProduct({ name: '', priceInSui: '', description: '', redirectURL: '' });
      await fetchProducts();
    } catch (e) {
      setProductError('Failed to add product.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    await fetchProducts();
  }

  function copyLink(link) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString();
  }

  function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = '/';
  }

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="loading-container">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="merchant-welcome">Welcome, {merchant.businessName}</p>
        </div>
        <div className="header-right">
          <span className="merchant-email">{merchant.email}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Add Product</h2>
          <form onSubmit={addProduct}>
            <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} type="text" placeholder="Product Name" className="input" required />
            <input 
              value={newProduct.priceInSui} 
              onChange={e => setNewProduct(p => ({ ...p, priceInSui: e.target.value }))} 
              type="number" 
              step="0.01" 
              min="0.01"
              placeholder="Price (SUI)" 
              className="input" 
              required 
            />
            <div className="merchant-address-display">
              <label>Merchant Wallet Address:</label>
              <span>{merchant.walletAddress}</span>
            </div>
            <input value={newProduct.redirectURL} onChange={e => setNewProduct(p => ({ ...p, redirectURL: e.target.value }))} type="url" placeholder="Redirect URL (optional)" className="input" />
            <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="textarea" />
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </form>
          {productError && <div className="error-text">{productError}</div>}
        </div>

        <div className="card">
          <h2 className="card-title">Products</h2>
          {products.length === 0 && <div className="muted-text">No products yet.</div>}
          {products.map(product => (
            <div key={product._id} className="product-item">
              <div>
                <div className="product-name">{product.name}</div>
                <div className="product-description">{product.description}</div>
                <div className="product-price">Price: <b>{parseFloat(product.priceInSui).toFixed(4)} SUI</b></div>
                <div className="product-merchant">Merchant: {product.merchantAddress}</div>
              </div>
              <div className="product-actions">
                <button onClick={() => copyLink(product.paymentLink)} className="copy-button">Copy Pay Link</button>
                <div className="payment-link">{product.paymentLink}</div>
                <button onClick={() => deleteProduct(product._id)} className="delete-button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Transactions</h2>
        {payments.length === 0 && <div className="muted-text">No transactions yet.</div>}
        <div className="table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Customer Wallet</th>
                <th>Txn Hash</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id}>
                  <td>{payment.product?.name || '-'}</td>
                  <td>{payment.amount}</td>
                  <td>
                    <span className={`status-${payment.status}`}>{payment.status}</span>
                  </td>
                  <td className="truncate">{payment.customerWallet || '-'}</td>
                  <td className="truncate">
                    {payment.txnHash ? (
                      <a href={`https://suiexplorer.com/txblock/${payment.txnHash}`} target="_blank" rel="noopener noreferrer" className="link">{payment.txnHash.slice(0, 8)}...</a>
                    ) : '-'}</td>
                  <td>{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {copied && (
        <div className="copy-notification">Link copied!</div>
      )}
    </div>
  );
}
