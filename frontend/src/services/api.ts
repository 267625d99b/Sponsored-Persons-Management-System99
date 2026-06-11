import axios from 'axios';

const getBaseURL = () => {
  // إذا كان هناك متغير بيئة محدد (Vercel أو أي منصة نشر)
  const viteEnv = (import.meta as any).env;
  if (viteEnv?.VITE_API_URL) {
    return viteEnv.VITE_API_URL;
  }
  // دعم بيئة Electron و localhost
  if (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:' ||
    (window as any).process?.versions?.electron
  ) {
    return 'http://localhost:5000/api';
  }
  return `${window.location.origin}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // التعامل مع انتهاء الجلسة أو عدم الصلاحية
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // إرجاع رسالة الخطأ بشكل موحد
    const message = error.response?.data?.message || 'حدث خطأ في الاتصال بالخادم';
    error.message = message;
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resendCode: (email: string) => api.post('/auth/resend-code', { email }),
  getMe: () => api.get('/auth/me'),
  setup: (data: { email: string; password: string; name: string }) => api.post('/auth/setup', data),
  getAllAdmins: () => api.get('/auth/admins'),
  createAdmin: (data: { email: string; password: string; name: string }) => api.post('/auth/create-admin', data),
  updateAdmin: (id: string, data: { name?: string; email?: string; newPassword?: string }) => api.put(`/auth/admins/${id}`, data),
  deleteAdmin: (id: string) => api.delete(`/auth/admins/${id}`),
  getAdminEmailConfig: (id: string) => api.get(`/auth/admins/${id}/email-config`),
  updateAdminEmailConfig: (id: string, data: { emailUser: string; emailPass?: string; emailService?: string }) => api.put(`/auth/admins/${id}/email-config`, data),
  testAdminEmail: (id: string) => api.post(`/auth/admins/${id}/test-email`),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword })
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
}

export const sponsoredAPI = {
  getAll: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    const query = queryParams.toString();
    return api.get(`/sponsored${query ? `?${query}` : ''}`);
  },
  getOne: (id: string) => api.get(`/sponsored/${id}`),
  create: (data: object) => api.post('/sponsored', data),
  update: (id: string, data: object) => api.put(`/sponsored/${id}`, data),
  delete: (id: string) => api.delete(`/sponsored/${id}`)
};

export const paymentAPI = {
  create: (data: object) => api.post('/payments', data),
  getBySponsored: (sponsoredId: string) => api.get(`/payments/sponsored/${sponsoredId}`),
  delete: (id: string) => api.delete(`/payments/${id}`)
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getYearlyReport: (year?: number) => api.get(`/reports/yearly/${year || ''}`)
};

export const documentAPI = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getBySponsored: (sponsoredId: string) => api.get(`/documents/sponsored/${sponsoredId}`),
  update: (id: string, data: object) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  getFileUrl: (filename: string) => `${getBaseURL()}/documents/file/${filename}`
};

export const backupAPI = {
  getAll: () => api.get('/backup'),
  create: () => api.post('/backup/create'),
  download: (id: string) => `${getBaseURL()}/backup/download/${id}`,
  restore: (id: string) => api.post(`/backup/restore/${id}`),
  delete: (id: string) => api.delete(`/backup/${id}`),
  exportData: () => api.get('/backup/export')
};

export const activityAPI = {
  getAll: (page = 1, limit = 50) => api.get(`/activity?page=${page}&limit=${limit}`),
  getStats: () => api.get('/activity/stats'),
  getByEntity: (type: string, id: string) => api.get(`/activity/entity/${type}/${id}`)
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: object) => api.put('/settings', data),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/settings/change-password', { currentPassword, newPassword }),
  updateName: (name: string) => api.post('/settings/update-name', { name }),
  updateEmail: (email: string, password: string) => 
    api.post('/settings/update-email', { email, password }),
  getEmailStatus: () => api.get('/settings/email-status'),
  updateEmailConfig: (emailService: string, emailUser: string, emailPass: string) =>
    api.post('/settings/email-config', { emailService, emailUser, emailPass }),
  testEmail: (testEmail?: string) => api.post('/settings/test-email', { testEmail }),
  sendEmail: (to: string, subject: string, message: string) => 
    api.post('/settings/send-email', { to, subject, message })
};

export const notificationAPI = {
  getAll: (limit = 50) => api.get(`/notifications?limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  triggerCheck: () => api.post('/notifications/trigger-check')
};

export default api;
