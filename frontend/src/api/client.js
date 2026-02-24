// Axios API client for Enterprise AI Support Platform
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

// Auth token injection
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Global error handling
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;

// ── API Methods ────────────────────────────────────────────────────────────────

export const queryAPI = {
    ask: (query, sessionId = null) =>
        api.post('/api/query/', { query, session_id: sessionId }),
};

export const ingestAPI = {
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/ingest/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    listDocuments: () => api.get('/api/ingest/documents'),
    getStats: () => api.get('/api/ingest/stats'),
};

export const analyticsAPI = {
    getOverview: () => api.get('/api/analytics/overview'),
    getDailyStats: (days = 30) => api.get(`/api/analytics/daily?days=${days}`),
    getCategories: () => api.get('/api/analytics/categories'),
    getKPISummary: () => api.get('/api/analytics/kpi-summary'),
};

export const ticketsAPI = {
    list: (params = {}) => api.get('/api/tickets/', { params }),
    getByRef: (ref) => api.get(`/api/tickets/${ref}`),
    update: (id, data) => api.patch(`/api/tickets/${id}`, data),
    getEscalated: () => api.get('/api/tickets/escalated/pending'),
};

export const authAPI = {
    login: (email, password) => api.post('/api/auth/login', { email, password }),
    register: (data) => api.post('/api/auth/register', data),
    getMe: () => api.get('/api/auth/me'),
};
