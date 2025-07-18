import React from 'react';
import { WalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import './SuietReactDemo.css'; // Import the CSS

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
    <div className="demo-container">
      <h2>Suiet React Demo</h2>
      <ConnectButton />
      {wallet.connected && (
        <div className="wallet-info">
          <div>Wallet: {wallet.name}</div>
          <div>Address: {wallet.account?.address}</div>
          <button onClick={handlePay} className="pay-button">
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
