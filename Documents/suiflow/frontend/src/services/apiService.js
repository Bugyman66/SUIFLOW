import { apiConfig, buildApiUrl } from '../config/api';
import authService from './authService';

class ApiService {
  async fetchWithAuth(endpoint, options = {}) {
    const token = authService.getToken();
    const url = buildApiUrl(endpoint);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      authService.logout();
      window.location.href = '/';
      throw new Error('Authentication failed');
    }

    return response;
  }

  // Products
  async getProducts() {
    const response = await this.fetchWithAuth(apiConfig.endpoints.products.list);
    return response.json();
  }

  async createProduct(productData) {
    const response = await this.fetchWithAuth(apiConfig.endpoints.products.create, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.json();
  }

  async deleteProduct(id) {
    const response = await this.fetchWithAuth(apiConfig.endpoints.products.delete(id), {
      method: 'DELETE',
    });
    return response.json();
  }

  // Payments
  async getPayments() {
    const response = await this.fetchWithAuth(apiConfig.endpoints.payments.list);
    return response.json();
  }

  async createPayment(paymentData) {
    const response = await this.fetchWithAuth(apiConfig.endpoints.payments.create, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response.json();
  }

  async verifyPayment(id, verificationData) {
    const response = await this.fetchWithAuth(apiConfig.endpoints.payments.verify(id), {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
    return response.json();
  }

  async getPaymentStatus(id) {
    const response = await this.fetchWithAuth(apiConfig.endpoints.payments.status(id));
    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
