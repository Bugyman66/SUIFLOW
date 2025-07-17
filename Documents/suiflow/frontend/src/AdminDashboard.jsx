import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    await Promise.all([fetchProducts(), fetchPayments()]);
  }
  async function fetchProducts() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  }
  async function fetchPayments() {
    const res = await fetch('/api/payments');
    setPayments(await res.json());
  }
  async function addProduct(e) {
    e.preventDefault();
    setLoading(true);
    setProductError('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (!res.ok) {
        const data = await res.json();
        setProductError(data.message || 'Failed to add product.');
        setLoading(false);
        return;
      }
      setNewProduct({ name: '', priceInSui: '', merchantAddress: '', description: '', redirectURL: '' });
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin Dashboard</h1>
        <button onClick={logout} style={{ background: '#eee', padding: '8px 20px', borderRadius: 6, fontWeight: 500 }}>Logout</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        {/* Add Product Form */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Add Product</h2>
          <form onSubmit={addProduct}>
            <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} type="text" placeholder="Product Name" style={inputStyle} required />
            <input value={newProduct.priceInSui} onChange={e => setNewProduct(p => ({ ...p, priceInSui: e.target.value }))} type="number" placeholder="Price (SUI)" style={inputStyle} required />
            <input value={newProduct.merchantAddress} onChange={e => setNewProduct(p => ({ ...p, merchantAddress: e.target.value }))} type="text" placeholder="Merchant Address" style={inputStyle} required />
            <input value={newProduct.redirectURL} onChange={e => setNewProduct(p => ({ ...p, redirectURL: e.target.value }))} type="url" placeholder="Redirect URL (optional)" style={inputStyle} />
            <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Description" style={{ ...inputStyle, minHeight: 60 }} />
            <button type="submit" style={{ width: '100%', background: '#22c55e', color: '#fff', padding: 10, borderRadius: 4, border: 'none', fontWeight: 'bold', marginTop: 8 }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </form>
          {productError && <div style={{ color: 'red', marginTop: 8 }}>{productError}</div>}
        </div>
        {/* Product List */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Products</h2>
          {products.length === 0 && <div style={{ color: '#888' }}>No products yet.</div>}
          {products.map(product => (
            <div key={product._id} style={{ marginBottom: 18, padding: 12, border: '1px solid #eee', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{product.description}</div>
                <div style={{ fontSize: 13 }}>Price: <b>{product.priceInSui} SUI</b></div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Merchant: {product.merchantAddress}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={() => copyLink(product.paymentLink)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 2 }}>Copy Pay Link</button>
                <div style={{ fontSize: 11, color: '#bbb', wordBreak: 'break-all' }}>{product.paymentLink}</div>
                <button onClick={() => deleteProduct(product._id)} style={{ color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: 4, padding: '2px 10px', fontSize: 12, marginTop: 6, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Transactions */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px #0001', marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Transactions</h2>
        {payments.length === 0 && <div style={{ color: '#888' }}>No transactions yet.</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 600, fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Customer Wallet</th>
                <th style={thStyle}>Txn Hash</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{payment.product?.name || '-'}</td>
                  <td>{payment.amount}</td>
                  <td>
                    <span style={{ color: payment.status === 'paid' ? '#16a34a' : payment.status === 'pending' ? '#eab308' : '#dc2626', fontWeight: 600 }}>{payment.status}</span>
                  </td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{payment.customerWallet || '-'}</td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {payment.txnHash ? (
                      <a href={`https://suiexplorer.com/txblock/${payment.txnHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{payment.txnHash.slice(0, 8)}...</a>
                    ) : '-'}
                  </td>
                  <td>{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Copy notification */}
      {copied && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#16a34a', color: '#fff', padding: '10px 24px', borderRadius: 8, boxShadow: '0 2px 8px #0005', zIndex: 1000 }}>
          Link copied!
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  marginBottom: 10,
  padding: 8,
  borderRadius: 4,
  border: '1px solid #ccc',
  fontSize: 15
};

const thStyle = {
  padding: '8px 10px',
  fontWeight: 600,
  background: '#f1f5f9',
  textAlign: 'left',
}; 