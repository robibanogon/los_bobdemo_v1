import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

// Applications API
export const applicationsAPI = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  submit: (id) => api.post(`/applications/${id}/submit`),
  complete: (id) => api.post(`/applications/${id}/complete`),
  getStatistics: () => api.get('/applications/statistics'),
};

// Documents API
export const documentsAPI = {
  getByApplication: (applicationId) => api.get(`/applications/${applicationId}/documents`),
  getChecklist: (applicationId) => api.get(`/applications/${applicationId}/documents/checklist`),
  upload: (applicationId, formData) => 
    api.post(`/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getById: (id) => api.get(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Agent Review API
export const agentReviewAPI = {
  run: (applicationId) => api.post(`/applications/${applicationId}/agent-review`),
};

// Analysis API
export const analysisAPI = {
  getByApplication: (applicationId) => api.get(`/applications/${applicationId}/analysis`),
  create: (applicationId) => api.post(`/applications/${applicationId}/analysis`),
  updateAssumptions: (applicationId, data) => 
    api.put(`/applications/${applicationId}/analysis/assumptions`, data),
};

// Decision API
export const decisionAPI = {
  getByApplication: (applicationId) => api.get(`/applications/${applicationId}/decision`),
  submitRecommendation: (applicationId, data) => 
    api.post(`/applications/${applicationId}/decision/recommend`, data),
  finalize: (applicationId, data) => 
    api.post(`/applications/${applicationId}/decision/finalize`, data),
};

// Memo API
export const memoAPI = {
  generate: (applicationId) => api.get(`/applications/${applicationId}/memo`),
};

// Audit API
export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
  getByApplication: (applicationId) => api.get(`/applications/${applicationId}/audit`),
};

// Config API
export const configAPI = {
  getPolicy: () => api.get('/config/policy'),
  updatePolicy: (data) => api.put('/config/policy', data),
};

export default api;

// Made with Bob
