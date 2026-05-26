import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const status  = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      toast.error('Session expired. Please log in again.');
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;

// ─── Auth endpoints ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)       => api.post('/auth/register', data),
  login:    (data)       => api.post('/auth/login', data),
  me:       ()           => api.get('/auth/me'),
  updateProfile: (data)  => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// ─── Paper endpoints ─────────────────────────────────────────────────────────
export const papersAPI = {
  getAll:   (params) => api.get('/papers', { params }),
  getOne:   (id)     => api.get(`/papers/${id}`),
  create:   (data)   => api.post('/papers', data),
  update:   (id, d)  => api.put(`/papers/${id}`, d),
  delete:   (id)     => api.delete(`/papers/${id}`),
  duplicate:(id)     => api.post(`/papers/${id}/duplicate`),
  export:   (id, fmt)=> api.get(`/papers/${id}/export/${fmt}`, { responseType: 'blob' }),
};

// ─── Generator endpoints ─────────────────────────────────────────────────────
export const generateAPI = {
  extractTopics: (formData) => api.post('/generate/extract-topics', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  generateQuestions: (data) => api.post('/generate/questions', data),
  regenerateQuestion: (data) => api.post('/generate/regenerate', data),
};

// ─── Question Bank endpoints ──────────────────────────────────────────────────
export const bankAPI = {
  getAll:   (params) => api.get('/bank', { params }),
  addMany:  (data)   => api.post('/bank/bulk', data),
  delete:   (id)     => api.delete(`/bank/${id}`),
  update:   (id, d)  => api.put(`/bank/${id}`, d),
  search:   (q)      => api.get('/bank/search', { params: { q } }),
};

// ─── Dashboard endpoints ──────────────────────────────────────────────────────
export const dashAPI = {
  stats:          () => api.get('/dashboard/stats'),
  recentActivity: () => api.get('/dashboard/activity'),
};
