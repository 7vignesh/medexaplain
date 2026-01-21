import axios from 'axios';

/**
 * API client for backend communication
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token
 */
api.interceptors.request.use(
  async (config) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Set authentication token
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * API endpoints
 */

// Auth
export const verifyToken = () => api.post('/api/auth/verify');

// User
export const getProfile = () => api.get('/api/users/profile');
export const updateProfile = (data: any) => api.put('/api/users/profile', data);
export const getUserStats = () => api.get('/api/users/stats');

// Reports
export const uploadReport = (formData: FormData) =>
  api.post('/api/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getReports = (params?: any) =>
  api.get('/api/reports', { params });

export const getReportById = (id: string) =>
  api.get(`/api/reports/${id}`);

export const deleteReport = (id: string) =>
  api.delete(`/api/reports/${id}`);

export const getParameterTrend = (parameterName: string) =>
  api.get(`/api/reports/trend/${parameterName}`);

export const addReportNotes = (id: string, notes: string) =>
  api.put(`/api/reports/${id}/notes`, { notes });

export const regenerateInsights = (id: string) =>
  api.post(`/api/reports/${id}/regenerate`);

export const generateRiskAssessment = (id: string, force: boolean = false) =>
  api.post(`/api/reports/${id}/risk-assessment?force=${force}`);
