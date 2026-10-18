import axios from 'axios';
import { logRequest, logResponse, logError } from '../utils/apiDiagnostics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token when implementing authentication
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.metadata = { startTime: Date.now() };
    logRequest(config);
    return config;
  },
  (error) => {
    logError(error, error.config);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = response.config.metadata?.startTime 
      ? Date.now() - response.config.metadata.startTime 
      : 0;
    logResponse(response, duration);
    return response;
  },
  (error) => {
    logError(error, error.config);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
