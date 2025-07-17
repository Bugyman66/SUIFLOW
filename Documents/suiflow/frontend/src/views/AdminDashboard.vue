<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div v-if="!isLoggedIn" class="max-w-sm mx-auto mt-20 bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Admin Login</h2>
      <input v-model="loginEmail" type="email" placeholder="Email" class="w-full mb-2 p-2 border rounded" />
      <input v-model="loginPassword" type="password" placeholder="Password" class="w-full mb-4 p-2 border rounded" />
      <button @click="login" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
    </div>
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Admin Dashboard</h1>
        <button @click="logout" class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Logout</button>
      </div>
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Add Product Form -->
        <div class="bg-white p-6 rounded shadow mb-8">
          <h2 class="text-lg font-semibold mb-4">Add Product</h2>
          <form @submit.prevent="addProduct">
            <input v-model="newProduct.name" type="text" placeholder="Product Name" class="w-full mb-2 p-2 border rounded" required />
            <input v-model="newProduct.priceInSui" type="number" step="0.000001" min="0.000001" placeholder="Price (SUI)" class="w-full mb-2 p-2 border rounded" required />
            <input v-model="newProduct.merchantAddress" type="text" placeholder="Merchant Address" class="w-full mb-2 p-2 border rounded" required />
            <input v-model="newProduct.redirectURL" type="url" placeholder="Redirect URL (optional)" class="w-full mb-2 p-2 border rounded" />
            <textarea v-model="newProduct.description" placeholder="Description" class="w-full mb-2 p-2 border rounded"></textarea>
            <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700" :disabled="loading">
              <span v-if="loading">Adding...</span>
              <span v-else>Add Product</span>
            </button>
          </form>
          <div v-if="productError" class="text-red-600 mt-2">{{ productError }}</div>
        </div>
        <!-- Product List -->
        <div class="bg-white p-6 rounded shadow mb-8">
          <h2 class="text-lg font-semibold mb-4">Products</h2>
          <div v-if="products.length === 0" class="text-gray-500">No products yet.</div>
          <div v-for="product in products" :key="product._id" class="mb-4 p-4 border rounded flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div class="font-bold">{{ product.name }}</div>
              <div class="text-sm text-gray-600">{{ product.description }}</div>
              <div class="text-sm">Price: <span class="font-semibold">{{ product.priceInSui }} SUI</span></div>
              <div class="text-xs text-gray-500">Merchant: {{ product.merchantAddress }}</div>
            </div>
            <div class="mt-2 md:mt-0 flex flex-col items-end">
              <button @click="copyLink(product.paymentLink)" class="text-blue-600 underline text-sm mb-1">Copy Pay Link</button>
              <span class="text-xs text-gray-400 break-all">{{ product.paymentLink }}</span>
              <button @click="openPaymentLinkModal(product)" class="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-xs">Create Payment Link</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Transactions -->
      <div class="bg-white p-6 rounded shadow mb-8">
        <h2 class="text-lg font-semibold mb-4">Transactions</h2>
        <div v-if="payments.length === 0" class="text-gray-500">No transactions yet.</div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-2 px-2">Product</th>
                <th class="py-2 px-2">Amount</th>
                <th class="py-2 px-2">Status</th>
                <th class="py-2 px-2">Customer Wallet</th>
                <th class="py-2 px-2">Txn Hash</th>
                <th class="py-2 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment._id" class="border-b">
                <td>{{ payment.product?.name || '-' }}</td>
                <td>{{ payment.amount }}</td>
                <td>
                  <span :class="{
                    'text-green-600': payment.status === 'paid',
                    'text-yellow-600': payment.status === 'pending',
                    'text-red-600': payment.status === 'failed'
                  }">{{ payment.status }}</span>
                </td>
                <td class="truncate max-w-xs">{{ payment.customerWallet || '-' }}</td>
                <td class="truncate max-w-xs">
                  <a v-if="payment.txnHash" :href="`https://suiexplorer.com/txblock/${payment.txnHash}`" target="_blank" class="text-blue-600 underline">{{ payment.txnHash.slice(0, 8) }}...</a>
                  <span v-else>-</span>
                </td>
                <td>{{ formatDate(payment.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Copy notification -->
      <transition name="fade">
        <div v-if="copied" class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">Link copied!</div>
      </transition>
    </div>
  </div>
  <template v-if="showPaymentLinkModal">
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-sm">
        <h3 class="text-lg font-bold mb-2">Create Payment Link for {{ selectedProduct?.name }}</h3>
        <input v-model="customPrice" type="number" min="0.000001" step="0.000001" placeholder="Enter custom price in SUI" class="w-full mb-2 p-2 border rounded" />
        <button @click="createCustomPaymentLink" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-2">Generate Link</button>
        <button @click="closePaymentLinkModal" class="w-full bg-gray-300 text-gray-800 py-2 rounded">Cancel</button>
        <div v-if="generatedPaymentLink" class="mt-2">
          <div class="text-xs text-gray-600 mb-1">Generated Link:</div>
          <input :value="generatedPaymentLink" readonly class="w-full p-1 border rounded text-xs mb-1" />
          <button @click="copyLink(generatedPaymentLink)" class="text-blue-600 underline text-xs">Copy</button>
        </div>
        <div v-if="customPaymentError" class="text-red-600 text-xs mt-1">{{ customPaymentError }}</div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isLoggedIn = ref(localStorage.getItem('adminLoggedIn') === 'true');
const loginEmail = ref('');
const loginPassword = ref('');
const loading = ref(false);
const productError = ref('');
const newProduct = ref({
  name: '',
  priceInSui: '',
  merchantAddress: '',
  description: '',
  redirectURL: ''
});
const products = ref([]);
const payments = ref([]);
const copied = ref(false);
const showPaymentLinkModal = ref(false);
const selectedProduct = ref(null);
const customPrice = ref('');
const generatedPaymentLink = ref('');
const customPaymentError = ref('');

function login() {
  // Dummy login: any email/password
  if (loginEmail.value && loginPassword.value) {
    localStorage.setItem('adminLoggedIn', 'true');
    isLoggedIn.value = true;
    fetchData();
  }
}
function logout() {
  localStorage.removeItem('adminLoggedIn');
  isLoggedIn.value = false;
}
async function addProduct() {
  loading.value = true;
  productError.value = '';
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct.value)
    });
    if (!res.ok) {
      const data = await res.json();
      productError.value = data.message || 'Failed to add product.';
      loading.value = false;
      return;
    }
    newProduct.value = { name: '', priceInSui: '', merchantAddress: '', description: '', redirectURL: '' };
    await fetchProducts();
  } catch (e) {
    productError.value = 'Failed to add product.';
  } finally {
    loading.value = false;
  }
}
async function fetchProducts() {
  const res = await fetch('/api/products');
  products.value = await res.json();
}
async function fetchPayments() {
  const res = await fetch('/api/payments');
  payments.value = await res.json();
}
async function fetchData() {
  await Promise.all([fetchProducts(), fetchPayments()]);
}
function copyLink(link) {
  navigator.clipboard.writeText(link);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}
function openPaymentLinkModal(product) {
  selectedProduct.value = product;
  customPrice.value = '';
  generatedPaymentLink.value = '';
  customPaymentError.value = '';
  showPaymentLinkModal.value = true;
}
function closePaymentLinkModal() {
  showPaymentLinkModal.value = false;
}
async function createCustomPaymentLink() {
  customPaymentError.value = '';
  generatedPaymentLink.value = '';
  if (!customPrice.value || isNaN(Number(customPrice.value)) || Number(customPrice.value) <= 0) {
    customPaymentError.value = 'Please enter a valid price.';
    return;
  }
  try {
    const res = await fetch('/api/payments/create-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedProduct.value._id, customPrice: customPrice.value })
    });
    const data = await res.json();
    if (!res.ok) {
      customPaymentError.value = data.message || 'Failed to create payment link.';
      return;
    }
    generatedPaymentLink.value = data.paymentLink;
  } catch (e) {
    customPaymentError.value = 'Failed to create payment link.';
  }
}
onMounted(() => {
  if (isLoggedIn.value) fetchData();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 