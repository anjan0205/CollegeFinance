import axios from 'axios';
import { handleClientRequest } from './firebaseClientService';

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

  // On production (Firebase Hosting / non-localhost), route directly to Firebase Client Engine
  if (!isLocalhost) {
    config.adapter = async (cfg) => {
      const url = cfg.url || '';
      const method = (cfg.method || 'GET').toUpperCase();
      const params = cfg.params || {};
      let body = {};
      try {
        if (cfg.data) body = typeof cfg.data === 'string' ? JSON.parse(cfg.data) : cfg.data;
      } catch (e) {}

      const res = await handleClientRequest(url, method, params, body);
      return {
        data: res.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: cfg,
        request: {}
      };
    };
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // If backend returns empty array for department filter (e.g. Dinf) on remote server, fallback to Firebase Client Engine
    if (!isLocalhost && response.config?.url?.includes('/prs') && response.data?.success && Array.isArray(response.data?.data) && response.data.data.length === 0 && response.config?.params?.department === 'Dinf') {
      const params = response.config.params || {};
      return handleClientRequest('/prs', 'GET', params, {}).then(res => ({
        ...response,
        data: res.data
      }));
    }
    return response;
  },
  async (error) => {
    // Fallback on error in production
    if (!isLocalhost && error.config) {
      try {
        const url = error.config.url || '';
        const method = (error.config.method || 'GET').toUpperCase();
        const params = error.config.params || {};
        let body = {};
        try {
          if (error.config.data) body = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
        } catch (e) {}
        const res = await handleClientRequest(url, method, params, body);
        return {
          data: res.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
          request: {}
        };
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
