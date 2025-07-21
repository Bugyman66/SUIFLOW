const API_BASE_URL = import.meta.env.VITE_API_URL;

class AuthService {
  constructor() {
    if (!API_BASE_URL) {
      console.warn('VITE_API_URL is not defined in environment variables');
    }
    console.log('AuthService initialized with API_BASE_URL:', API_BASE_URL);
  }

  async login(email, password) {
    try {
      if (!API_BASE_URL) {
        throw new Error('API URL is not configured');
      }

      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Login failed:', data);
        throw new Error(data.message || 'Login failed');
      }

      console.log('Login successful');
      
      // Store the token
      localStorage.setItem('token', data.token);
      
      // Store merchant data if available
      if (data.merchant) {
        localStorage.setItem('merchant', JSON.stringify(data.merchant));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Update stored merchant data
      if (data.merchant) {
        localStorage.setItem('merchant', JSON.stringify(data.merchant));
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('merchant');
  }

  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getMerchant() {
    const merchantData = localStorage.getItem('merchant');
    return merchantData ? JSON.parse(merchantData) : null;
  }
}
