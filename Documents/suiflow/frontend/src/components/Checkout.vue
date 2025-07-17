<template>
  <div class="checkout">
    <h2>Checkout</h2>
    <div v-if="product">
      <div class="product-details">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p>Price: {{ product.priceInSui }} SUI</p>
      </div>
    </div>
    <div v-if="!walletConnected">
      <button @click="connectMartianWallet">Connect Martian Wallet</button>
      <button @click="connectPhantomWallet" style="margin-left: 10px;">Connect Phantom Wallet</button>
    </div>
    <div v-else>
      <p>Connected wallet: {{ walletAddress }} ({{ connectedWalletType }})</p>
      <button @click="sendPayment" :disabled="loading">Pay Now</button>
      <button @click="disconnectWallet" style="margin-left: 10px;">Disconnect Wallet</button>
    </div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success">{{ successMessage }}</div>
  </div>
</template>

<script>
import { TransactionBlock } from '@mysten/sui.js/transactions';
export default {
  props: {
    productId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      walletConnected: false,
      walletAddress: '',
      errorMessage: '',
      successMessage: '',
      txnHash: '',
      martian: null,
      phantom: null,
      connectedWalletType: '',
      product: null,
      paymentId: '',
      loading: false
    };
  },
  async mounted() {
    await this.fetchProduct();
  },
  methods: {
    isValidSuiAddress(address) {
      return /^0x[a-fA-F0-9]{40,64}$/.test(address);
    },
    async fetchProduct() {
      try {
        const res = await fetch(`/api/products/${this.productId}`);
        if (!res.ok) throw new Error('Product not found');
        this.product = await res.json();
      } catch (error) {
        this.errorMessage = 'Failed to load product.';
      }
    },
    async connectMartianWallet() {
      try {
        const martian = window.martian || window.martianWallet;
        if (!martian) {
          this.errorMessage = 'Martian Wallet not found. Please install Martian Wallet.';
          return;
        }
        let accounts;
        if (martian.sui && typeof martian.sui.connect === 'function') {
          accounts = await martian.sui.connect();
        } else if (typeof martian.connect === 'function') {
          accounts = await martian.connect();
        } else {
          this.errorMessage = 'Martian Wallet does not support Sui connection.';
          return;
        }
        if (!accounts || !accounts.address) {
          this.errorMessage = 'Failed to connect Martian Wallet.';
          return;
        }
        if (!this.isValidSuiAddress(accounts.address)) {
          this.errorMessage = 'Connected address is not a valid Sui address.';
          this.walletConnected = false;
          this.walletAddress = '';
          this.martian = null;
          return;
        }
        this.walletAddress = accounts.address;
        this.walletConnected = true;
        this.errorMessage = '';
        this.martian = martian;
        this.phantom = null;
        this.connectedWalletType = 'Martian';
      } catch (error) {
        this.errorMessage = 'Wallet connection failed.';
        console.error(error);
      }
    },
    async connectPhantomWallet() {
      try {
        const phantom = window.phantom?.sui;
        console.log('phantom.sui:', phantom);
        console.log('phantom.sui.connect:', typeof phantom?.connect);
        console.log('phantom.sui.signAndExecuteTransactionBlock:', typeof phantom?.signAndExecuteTransactionBlock);
        if (!phantom) {
          this.errorMessage = 'Phantom Wallet not found. Please install Phantom Wallet.';
          return;
        }
        let accounts;
        if (typeof phantom.connect === 'function') {
          accounts = await phantom.connect();
        } else {
          this.errorMessage = 'Phantom Wallet does not support Sui connection.';
          return;
        }
        if (!accounts || !accounts.address) {
          this.errorMessage = 'Failed to connect Phantom Wallet.';
          return;
        }
        if (!this.isValidSuiAddress(accounts.address)) {
          this.errorMessage = 'Connected address is not a valid Sui address.';
          this.walletConnected = false;
          this.walletAddress = '';
          this.phantom = null;
          return;
        }
        this.walletAddress = accounts.address;
        this.walletConnected = true;
        this.errorMessage = '';
        this.phantom = phantom;
        this.martian = null;
        this.connectedWalletType = 'Phantom';
      } catch (error) {
        this.errorMessage = 'Wallet connection failed.';
        console.error(error);
      }
    },
    async sendPayment() {
      try {
        this.loading = true;
        this.successMessage = '';
        this.errorMessage = '';
        // 1. Create payment entry linked to product
        const paymentRes = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: this.productId })
        });
        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) {
          this.errorMessage = paymentData.message || 'Failed to create payment entry.';
          this.loading = false;
          return;
        }
        this.paymentId = paymentData.paymentId;
        // 2. Send payment transaction using Sui TransactionBlock API
        const amountMist = Math.floor(Number(this.product.priceInSui) * 1_000_000_000);
        console.log('merchantAddress:', this.product.merchantAddress);
        console.log('amountMist:', amountMist);
        const txb = new TransactionBlock();
        const [coin] = txb.splitCoins(txb.gas, [amountMist]);
        txb.transferObjects([coin], this.product.merchantAddress);
        let response;
        if (this.martian && this.connectedWalletType === 'Martian') {
          response = await this.martian.sui.signAndExecuteTransactionBlock({
            transactionBlock: txb,
          });
        } else if (this.phantom && this.connectedWalletType === 'Phantom') {
          response = await this.phantom.signAndExecuteTransactionBlock({
            transactionBlock: txb,
          });
        } else {
          this.errorMessage = 'No wallet connected.';
          this.loading = false;
          return;
        }
        if (!response || !response.digest) {
          this.errorMessage = 'Payment failed: No transaction hash returned.';
          this.loading = false;
          return;
        }
        this.txnHash = response.digest;
        // 3. Notify backend for verification
        await fetch(`/api/payments/${this.paymentId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txnHash: this.txnHash,
            customerWallet: this.walletAddress,
          }),
        });
        // Redirect if product has redirectURL
        if (this.product.redirectURL) {
          window.location.href = `${this.product.redirectURL}?paymentId=${this.paymentId}`;
          // Also notify parent if in iframe (for SDK)
          if (window.parent !== window) {
            window.parent.postMessage({ suiflowSuccess: true, txHash: this.txnHash }, '*');
          }
        } else {
          this.successMessage = 'Payment sent! Txn Hash: ' + this.txnHash;
          // Also notify parent if in iframe (for SDK)
          if (window.parent !== window) {
            window.parent.postMessage({ suiflowSuccess: true, txHash: this.txnHash }, '*');
          }
        }
      } catch (error) {
        this.errorMessage = 'Payment failed: ' + (error.message || JSON.stringify(error));
      } finally {
        this.loading = false;
      }
    },
    disconnectWallet() {
      this.walletConnected = false;
      this.walletAddress = '';
      this.martian = null;
      this.phantom = null;
      this.connectedWalletType = '';
      this.successMessage = '';
      this.errorMessage = '';
      this.txnHash = '';
      this.paymentId = '';
    }
  }
};
</script>

<style scoped>
.checkout {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.product-details {
  margin-bottom: 20px;
  background: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
}
.error {
  color: red;
}
.success {
  color: green;
}
</style>
