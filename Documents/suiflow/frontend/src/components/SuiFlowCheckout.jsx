import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import './SuiFlowCheckout.css';

// Icons
const SuiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
    <path d="M18 12a2 2 0 0 0-2 2v2h2v-2a2 2 0 0 1 2-2h2v-2h-2a2 2 0 0 0-2 2v2h-2v-2a2 2 0 0 1 2-2h2v-2h-2z"></path>
  </svg>
);

const PaymentStep = ({ step, currentStep, title, children }) => (
  <div className={`sui-payment-step ${currentStep >= step ? 'active' : ''}`}>
    <div className="sui-step-header">
      <div className="sui-step-number">{step}</div>
      <h3>{title}</h3>
    </div>
    {currentStep >= step && <div className="sui-step-content">{children}</div>}
  </div>
);

const CheckoutContent = () => {
  const { productId } = useParams();
  const wallet = useWallet();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txnHash, setTxnHash] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  console.log('CheckoutContent rendered with productId:', productId);

  useEffect(() => {
    async function fetchProduct() {
      setError('');
      console.log('Fetching product with ID:', productId);
      
      if (!productId) {
        setError('No product ID provided');
        return;
      }
      
      try {
        const res = await fetch(`http://localhost:4000/api/products/${productId}`);
        console.log('Product fetch response:', res.status, res.ok);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Product fetch error:', errorData);
          throw new Error(errorData.message || 'Product not found');
        }
        
        const productData = await res.json();
        console.log('Product data received:', productData);
        setProduct(productData);
      } catch (e) {
        console.error('Product fetch failed:', e);
        setError('Failed to load product: ' + e.message);
      }
    }
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (wallet.connected && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [wallet.connected, currentStep]);

  const handleConnectWallet = () => {
    setCurrentStep(2);
  };

  const handlePay = async () => {
    if (!wallet.connected) {
      setError('Please connect your wallet first!');
      return;
    }
    
    setPaymentProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const paymentRes = await fetch('http://localhost:4000/api/payments/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productId })
      });
      
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        setError(paymentData.message || 'Failed to create payment entry.');
        setPaymentProcessing(false);
        return;
      }
      
      const paymentId = paymentData.paymentId;
      console.log('Payment created successfully:', paymentData);
      console.log('Payment ID for verification:', paymentId);
      console.log('Payment ID type:', typeof paymentId);
      console.log('Payment ID length:', paymentId?.length);
      
      // Validate payment ID format (MongoDB ObjectId is 24 characters)
      if (!paymentId || paymentId.length !== 24) {
        setError('Invalid payment ID received from server');
        setPaymentProcessing(false);
        return;
      }
      
      const txb = new TransactionBlock();
      const amountInMist = Math.floor(parseFloat(product.priceInSui) * 1_000_000_000);
      
      console.log(`Transferring ${product.priceInSui} SUI (${amountInMist} MIST) to ${product.merchantAddress}`);
      
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(amountInMist)]);
      txb.transferObjects([coin], txb.pure(product.merchantAddress, 'address'));
      txb.setGasBudget(100_000_000);
      
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
      
      if (!response || !response.digest) {
        setError('Payment failed: No transaction hash returned.');
        setPaymentProcessing(false);
        return;
      }
      
      setTxnHash(response.digest);
      
      console.log('Payment successful, waiting for blockchain confirmation...');
      console.log('Payment ID:', paymentId);
      console.log('Transaction Hash:', response.digest);
      console.log('Customer Wallet:', wallet.account?.address);
      
      // Wait for transaction to be processed on blockchain
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Payment successful, verifying with backend...');
      console.log('Payment ID:', paymentId);
      console.log('Transaction Hash:', response.digest);
      console.log('Customer Wallet:', wallet.account?.address);
      
      const verifyRes = await fetch(`http://localhost:4000/api/payments/verify/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnHash: response.digest,
          customerWallet: wallet.account?.address,
        }),
      });
      
      console.log('Verification URL:', `http://localhost:4000/api/payments/verify/${paymentId}`);
      console.log('Verification request body:', {
        txnHash: response.digest,
        customerWallet: wallet.account?.address,
      });
      console.log('Verification response status:', verifyRes.status);
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        console.log('Payment verification successful:', verifyData);
        setSuccess('Payment successful!');
        setCurrentStep(3);
      } else {
        const verifyError = await verifyRes.json().catch(() => ({}));
        console.error('Payment verification failed:', verifyError);
        console.error('Verification error details:', verifyError);
        setError('Payment verification failed: ' + (verifyError.message || 'Unknown error'));
        return;
      }
      
      if (window.parent !== window) {
        window.parent.postMessage({ suiflowSuccess: true, txHash: response.digest }, '*');
      }
      
      if (product.redirectURL) {
        setTimeout(() => {
          window.location.href = `${product.redirectURL}?paymentId=${paymentId}`;
        }, 3000);
      }
    } catch (e) {
      setError('Payment failed: ' + (e.message || e.toString()));
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!productId) {
    return (
      <div className="sui-checkout-container">
        <div className="sui-checkout-header">
          <div className="sui-logo">
            <img src="/logo.png" alt="SuiFlow Logo" className="sui-logo-image" />
          </div>
        </div>
        <div className="sui-checkout-content">
          <div className="sui-error-message">
            <h2>Invalid Checkout Link</h2>
            <p>No product ID provided. Please use a valid checkout link.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="sui-checkout-container">
        <div className="sui-checkout-header">
          <div className="sui-logo">
            <img src="/logo.png" alt="SuiFlow Logo" className="sui-logo-image" />
          </div>
        </div>
        <div className="sui-checkout-content">
          <div className="sui-checkout-loading">
            <div className="sui-loading-spinner"></div>
            <p>Loading product details...</p>
            {error && <p className="sui-error-text">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sui-checkout-container">
      <div className="sui-checkout-header">
        <div className="sui-logo">
          <img src="/logo.png" alt="SuiFlow Logo" className="sui-logo-image" />
        </div>
        <div className="sui-secure-badge">
          <CheckIcon />
          <span>Secure Payment</span>
        </div>
      </div>

      <div className="sui-checkout-content">
        <div className="sui-product-card">
          <div className="sui-product-image">
            <SuiIcon />
          </div>
          <div className="sui-product-details">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <div className="sui-product-price">
              <span className="sui-price-amount">{parseFloat(product.priceInSui).toFixed(4)}</span>
              <span className="sui-price-currency">SUI</span>
            </div>
          </div>
        </div>

        <div className="sui-payment-steps">
          <PaymentStep step={1} currentStep={currentStep} title="Connect Wallet">
            <div className="sui-connect-wallet">
              <p>Connect your Sui wallet to proceed with payment</p>
              <ConnectButton className="sui-connect-button" />
            </div>
          </PaymentStep>

          <PaymentStep step={2} currentStep={currentStep} title="Review & Pay">
            {wallet.connected && (
              <div className="sui-payment-review">
                <div className="sui-wallet-info">
                  <WalletIcon />
                  <div>
                    <span className="sui-wallet-name">{wallet.name}</span>
                    <span className="sui-wallet-address">{wallet.account?.address}</span>
                  </div>
                </div>
                
                <div className="sui-payment-summary">
                  <div className="sui-summary-item">
                    <span>Product</span>
                    <span>{product.name}</span>
                  </div>
                  <div className="sui-summary-item">
                    <span>Amount</span>
                    <span>{parseFloat(product.priceInSui).toFixed(4)} SUI</span>
                  </div>
                  <div className="sui-summary-item sui-total">
                    <span>Total</span>
                    <span>{parseFloat(product.priceInSui).toFixed(4)} SUI</span>
                  </div>
                </div>
                
                <button 
                  onClick={handlePay} 
                  className="sui-pay-button"
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <>
                      <div className="sui-loading-spinner-small"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <SuiIcon />
                      Pay {parseFloat(product.priceInSui).toFixed(4)} SUI
                    </>
                  )}
                </button>
              </div>
            )}
          </PaymentStep>

          <PaymentStep step={3} currentStep={currentStep} title="Payment Complete">
            <div className="sui-success-content">
              <div className="sui-success-checkmark">
                <CheckIcon />
              </div>
              <h3>Payment Successful!</h3>
              <p>Your transaction has been processed successfully.</p>
              
              {txnHash && (
                <div className="sui-transaction-details">
                  <span>Transaction Hash:</span>
                  <code>{txnHash}</code>
                </div>
              )}
              
              <div className="sui-success-actions">
                <button 
                  onClick={() => window.close()} 
                  className="sui-button sui-button-secondary"
                >
                  Close Window
                </button>
                {product.redirectURL && (
                  <button 
                    onClick={() => window.location.href = product.redirectURL}
                    className="sui-button sui-button-primary"
                  >
                    Return to Merchant
                  </button>
                )}
              </div>
            </div>
          </PaymentStep>
        </div>
      </div>

      {error && (
        <div className="sui-error-message">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const SuiFlowCheckout = () => {
  return (
    <WalletProvider>
      <CheckoutContent />
    </WalletProvider>
  );
};

export default SuiFlowCheckout; 