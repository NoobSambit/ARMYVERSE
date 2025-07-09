import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for long-running operations like Spotify sync
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

export default api;