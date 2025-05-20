import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('[Axios Interceptor] Token found, adding Authorization header.');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[Axios Interceptor] No authToken found in localStorage.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[Axios Interceptor] Received 401 Unauthorized. Logging out.');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 