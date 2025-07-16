<template>
  <div class="checkout">
    <h2>Checkout</h2>
    <div v-if="!walletConnected">
      <button @click="connectWallet">Connect Slush Wallet</button>
    </div>
    <div v-else>
      <p>Connected wallet: {{ walletAddress }}</p>
      <button @click="sendPayment">Pay Now</button>
    </div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success">{{ successMessage }}</div>
  </div>
</template>

<script>
import { registerSlushWallet } from '@mysten/slush-wallet';
import { TransactionBlock } from '@mysten/sui.js/transactions'; // Required for sending payments

export default {
  data() {
    return {
      walletConnected: false,
      walletAddress: '',
      errorMessage: '',
      successMessage: '',
      amount: 1_000_000_000, // 1 SUI in octas (1e9) - adjust as needed
      merchantAddress: '0xMERCHANT_ADDRESS_HERE',
      paymentId: '12345',
      txnHash: ''
    };
  },
  methods: {
    async connectWallet() {
      try {
        const result = await registerSlushWallet('My Dapp');
        if (!result) {
          this.errorMessage = 'Slush wallet not found. Please install Slush.';
          return;
        }

        const { wallet } = result;
        const accounts = await wallet.requestAccounts();
        this.walletAddress = accounts[0];
        this.walletConnected = true;
        this.slushWallet = wallet;
        this.errorMessage = '';
      } catch (error) {
        this.errorMessage = 'Wallet connection failed.';
        console.error(error);
      }
    },

    async sendPayment() {
      try {
        if (!this.slushWallet) {
          this.errorMessage = 'Wallet not connected.';
          return;
        }

        const tx = new TransactionBlock();
        tx.transferObjects(
          [tx.gas], // use default gas coin
          this.merchantAddress
        );
        tx.setGasBudget(100_000_000); // adjust depending on expected gas

        const result = await this.slushWallet.signAndExecuteTransactionBlock({
          transactionBlock: tx,
          options: {
            showEffects: true,
          },
        });

        this.txnHash = result.digest;
        this.successMessage = 'Payment sent! Txn Hash: ' + this.txnHash;
        this.errorMessage = '';

        // Notify backend
        await fetch(`/api/payments/${this.paymentId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txnHash: this.txnHash,
            customerWallet: this.walletAddress,
          }),
        });
      } catch (error) {
        this.errorMessage = 'Payment failed: ' + (error.message || error.toString());
        this.successMessage = '';
        console.error(error);
      }
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
.error {
  color: red;
}
.success {
  color: green;
}
</style>
