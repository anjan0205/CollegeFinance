import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || (isLocalhost ? 'http://localhost:5000/api' : 'https://college-finance-backend.anjanpanga2006.workers.dev/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('college_budget_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('[API Interceptor] Token expired or invalid. Clearing token.');
      localStorage.removeItem('college_budget_token');
    }
    return Promise.reject(error);
  }
);

export default api;
