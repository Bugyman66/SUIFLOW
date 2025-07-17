<template>
  <div class="pay-page">
    <h1>Payment Page</h1>
    <Checkout :productId="$route.params.productId" />
  </div>
</template>

<script>
import Checkout from '../components/Checkout.vue';

export default {
  components: {
    Checkout
  }
}
</script>

<style scoped>
.pay-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>