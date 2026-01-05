import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only redirect on 401 if we're not already on the login page
    // This prevents redirect loops and allows login errors to be handled properly
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  check: () => api.get('/auth/check'),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getCourse: (code) => api.get(`/courses/${code}`),
  requestCourse: (data) => api.post('/courses/request', data),
  getList: () => api.get('/courses/list'),
};

// Calendar API
export const calendarAPI = {
  getEvents: () => api.get('/calendar/events'),
  getCourses: () => api.get('/calendar/courses'),
  saveTimetable: (data) => api.post('/calendar/save', data),
  getMyTimetable: () => api.get('/calendar/mytimetable'),
};

// Group API
export const groupAPI = {
  getRequests: () => api.get('/group/requests'),
  createRequest: (data) => api.post('/group/requests', data),
  sendInvitation: (id, message) => api.post(`/group/requests/${id}/invite`, { message }),
  deleteRequest: (id) => api.delete(`/group/requests/${id}`),
};

// Questionnaire API
export const questionnaireAPI = {
  getAll: () => api.get('/questionnaire'),
  create: (data) => api.post('/questionnaire', data),
  fill: (id) => api.post(`/questionnaire/${id}/fill`),
  getMy: () => api.get('/questionnaire/my'),
};

// Materials API
export const materialsAPI = {
  getCourseMaterials: (code) => api.get(`/materials/course/${code}`),
  uploadMaterial: (code, data) => api.post(`/materials/course/${code}`, data),
  downloadMaterial: (id) => window.open(`${API_BASE_URL}/materials/download/${id}`, '_blank'),
};

// Profile API
export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  updateProfile: (data) => api.put('/profile/update', data),
  getUser: (sid) => api.get(`/profile/${sid}`),
};

// Admin API
export const adminAPI = {
  getPendingAccounts: () => api.get('/admin/pending/accounts'),
  approveAccount: (sid) => api.post(`/admin/pending/accounts/${sid}/approve`),
  rejectAccount: (sid, reason) => api.post(`/admin/pending/accounts/${sid}/reject`, { reason }),
  getPendingCourses: () => api.get('/admin/pending/courses'),
  approveCourse: (id) => api.post(`/admin/pending/courses/${id}/approve`),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (sid) => api.delete(`/admin/users/${sid}`),
  getStats: () => api.get('/admin/stats'),
};

// Upload API
export const uploadAPI = {
  getProfilePhoto: (sid) => `${API_BASE_URL}/upload/profile-photo/user/${sid}`,
};

export default api;
