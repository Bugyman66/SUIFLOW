<template>
  <div class="checkout">
    <h2>Checkout</h2>
    <form @submit.prevent="submitPayment">
      <div>
        <label for="cardNumber">Card Number:</label>
        <input type="text" v-model="cardNumber" id="cardNumber" required />
      </div>
      <div>
        <label for="expiryDate">Expiry Date:</label>
        <input type="text" v-model="expiryDate" id="expiryDate" required placeholder="MM/YY" />
      </div>
      <div>
        <label for="cvv">CVV:</label>
        <input type="text" v-model="cvv" id="cvv" required />
      </div>
      <button type="submit">Pay Now</button>
    </form>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success">{{ successMessage }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      errorMessage: '',
      successMessage: ''
    };
  },
  methods: {
    async submitPayment() {
      try {
        // Call the API to process the payment
        const response = await this.$api.submitPayment({
          cardNumber: this.cardNumber,
          expiryDate: this.expiryDate,
          cvv: this.cvv
        });
        this.successMessage = 'Payment successful!';
        this.errorMessage = '';
      } catch (error) {
        this.errorMessage = 'Payment failed. Please try again.';
        this.successMessage = '';
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