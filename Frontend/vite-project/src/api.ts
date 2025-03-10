import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor
api.interceptors.request.use(
  config => {
    // You could add auth tokens here
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle network errors or server unavailability
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      console.log('Server unavailable - using demo mode');
      // You could trigger demo mode here
    }
    return Promise.reject(error);
  }
);

export default api;