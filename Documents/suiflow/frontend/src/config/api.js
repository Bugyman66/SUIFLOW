// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
    },
    payments: {
      list: '/payments/merchant/payments',
      create: '/payments/create',
      verify: (id) => `/payments/verify/${id}`,
      status: (id) => `/payments/status/${id}`,
    },
    products: {
      list: '/products',
      create: '/products',
      delete: (id) => `/products/${id}`,
      get: (id) => `/products/${id}`,
    },
  },
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
