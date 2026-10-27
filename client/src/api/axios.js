import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// Add the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Success: returns the "data" part of { ok: true, data }
// Error: throws Error with .message and .code from { ok: false, error }
api.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const status = err.response?.status;
    const isAuthCall = /\/auth\/(login|register)/.test(err.config?.url || '');

    if (status === 401 && !isAuthCall) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    }

    const apiError = err.response?.data?.error;
    const error = new Error(apiError?.message || 'Network error. Check your connection.');
    error.code = apiError?.code || 'NETWORK_ERROR';
    error.status = status;
    return Promise.reject(error);
  }
);

export default api;
