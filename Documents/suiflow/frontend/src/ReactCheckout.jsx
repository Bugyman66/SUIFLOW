import React, { useEffect, useState } from 'react';
import { WalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import { TransactionBlock } from '@mysten/sui.js/transactions';

function CheckoutContent({ productId }) {
  const wallet = useWallet();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txnHash, setTxnHash] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setError('');
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Product not found');
        setProduct(await res.json());
      } catch (e) {
        setError('Failed to load product.');
      }
    }
    fetchProduct();
  }, [productId]);

  const handlePay = async () => {
    if (!wallet.connected) {
      setError('Please connect your wallet first!');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Create payment entry
      const paymentRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        setError(paymentData.message || 'Failed to create payment entry.');
        setLoading(false);
        return;
      }
      const paymentId = paymentData.paymentId;
      // 2. Send payment transaction using TransactionBlock
      const txb = new TransactionBlock();
      // SUI uses 1e9 (1_000_000_000) for 1 SUI, so priceInSui should be in octas
      txb.transferObjects(
        [txb.gas],
        txb.pure(product.merchantAddress, 'address')
      );
      txb.setGasBudget(100_000_000); // adjust as needed
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
      if (!response || !response.digest) {
        setError('Payment failed: No transaction hash returned.');
        setLoading(false);
        return;
      }
      setTxnHash(response.digest);
      // 3. Notify backend for verification
      await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnHash: response.digest,
          customerWallet: wallet.account?.address,
        }),
      });
      setSuccess('Payment sent! Txn Hash: ' + response.digest);
      // Notify parent window (for SDK)
      if (window.parent !== window) {
        window.parent.postMessage({ suiflowSuccess: true, txHash: response.digest }, '*');
      }
      // Optionally redirect if product.redirectURL exists
      if (product.redirectURL) {
        window.location.href = `${product.redirectURL}?paymentId=${paymentId}`;
      }
    } catch (e) {
      setError('Payment failed: ' + (e.message || e.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      <h2>Suiflow Checkout</h2>
      {product ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <div><b>{product.name}</b></div>
            <div>{product.description}</div>
            <div>Price: <b>{product.priceInSui} SUI</b></div>
            <div className="text-xs text-gray-500">Merchant: {product.merchantAddress}</div>
          </div>
          <ConnectButton />
          {wallet.connected && (
            <div style={{ marginTop: 16 }}>
              <div>Wallet: {wallet.name}</div>
              <div>Address: {wallet.account?.address}</div>
              <button onClick={handlePay} style={{ marginTop: 16, padding: '8px 16px' }} disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div>Loading product...</div>
      )}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
      {txnHash && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          Txn Hash: <span style={{ wordBreak: 'break-all' }}>{txnHash}</span>
        </div>
      )}
    </div>
  );
}

export default function ReactCheckout({ productId }) {
  return (
    <WalletProvider>
      <CheckoutContent productId={productId} />
    </WalletProvider>
  );
} 