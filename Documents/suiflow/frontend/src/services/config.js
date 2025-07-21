// Service configuration
export const config = {
  getApiUrl: () => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      console.warn('VITE_API_URL is not defined in environment variables');
      // Fallback to default URL
      return 'https://suiflow.onrender.com/api';
    }
    return url;
  }
};
