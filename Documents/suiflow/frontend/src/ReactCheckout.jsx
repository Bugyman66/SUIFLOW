import React, { useEffect, useState } from 'react';
import { WalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import './Checkout.css';

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

      const txb = new TransactionBlock();
      txb.transferObjects(
        [txb.gas],
        txb.pure(product.merchantAddress, 'address')
      );
      txb.setGasBudget(100_000_000);
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
      await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnHash: response.digest,
          customerWallet: wallet.account?.address,
        }),
      });
      setSuccess('Payment sent! Txn Hash: ' + response.digest);
      if (window.parent !== window) {
        window.parent.postMessage({ suiflowSuccess: true, txHash: response.digest }, '*');
      }
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
    <div className="checkout-wrapper">
      <h2>Suiflow Checkout</h2>
      {product ? (
        <>
          <div className="product-details">
            <div><b>{product.name}</b></div>
            <div>{product.description}</div>
            <div>Price: <b>{product.priceInSui} SUI</b></div>
            <div className="merchant-info">Merchant: {product.merchantAddress}</div>
          </div>
          <ConnectButton />
          {wallet.connected && (
            <div className="wallet-info">
              <div>Wallet: {wallet.name}</div>
              <div>Address: {wallet.account?.address}</div>
              <button onClick={handlePay} className="pay-button" disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div>Loading product...</div>
      )}
      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}
      {txnHash && (
        <div className="txn-hash">
          Txn Hash: <span>{txnHash}</span>
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
