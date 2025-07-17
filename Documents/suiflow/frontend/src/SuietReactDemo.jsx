import React from 'react';
import { WalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

function PaymentDemo() {
  const wallet = useWallet();

  const handlePay = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first!');
      return;
    }
    try {
      alert('Connected wallet address: ' + wallet.account?.address);
      // Example: await wallet.signAndExecuteTransaction({ transaction: tx });
    } catch (e) {
      alert('Payment failed: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Suiet React Demo</h2>
      <ConnectButton />
      {wallet.connected && (
        <div style={{ marginTop: 16 }}>
          <div>Wallet: {wallet.name}</div>
          <div>Address: {wallet.account?.address}</div>
          <button onClick={handlePay} style={{ marginTop: 16, padding: '8px 16px' }}>
            Pay Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function SuietReactDemo() {
  return (
    <WalletProvider>
      <PaymentDemo />
    </WalletProvider>
  );
} 