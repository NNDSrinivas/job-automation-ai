// API Configuration for Production-Ready Application
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://your-domain.com/api';  // Replace with your production domain

const API_ENDPOINTS = {
  // Authentication
  login: '/login',
  signup: '/signup',
  logout: '/logout',
  refreshToken: '/refresh',
  verifyEmail: '/verify-email',
  requestPasswordReset: '/request-password-reset',
  resetPassword: '/reset-password',

  // User Profile
  profile: '/profile',
  updateProfile: '/profile/update',

  // Resume Management
  uploadResume: '/resume/upload',
  parseResume: '/resume/parse',
  getResumes: '/resumes',
  deleteResume: '/resume/delete',
  setPrimaryResume: '/resume/set-primary',

  // Job Management
  jobs: '/jobs',
  jobSearch: '/jobs/search',
  jobScrape: '/jobs/scrape',
  jobMatch: '/jobs/match',

  // Job Applications
  applications: '/applications',
  applyToJob: '/applications/apply',
  bulkApply: '/applications/bulk-apply',
  applicationStatus: '/applications/status',

  // Automation
  automationSettings: '/automation/settings',
  startAutomation: '/automation/start',
  stopAutomation: '/automation/stop',
  automationStatus: '/automation/status',

  // Analytics
  analytics: '/analytics',
  applicationStats: '/analytics/applications',
  jobStats: '/analytics/jobs',
  performanceMetrics: '/analytics/performance',

  // AI Features
  generateCoverLetter: '/ai/cover-letter',
  optimizeResume: '/ai/optimize-resume',
  interviewPrep: '/ai/interview-prep',
  skillAnalysis: '/ai/skill-analysis',

  // Credentials
  credentials: '/credentials',
  saveCredentials: '/credentials/save',
  testCredentials: '/credentials/test',

  // Notifications
  notifications: '/notifications',
  markAsRead: '/notifications/read',

  // WebSocket
  websocket: '/ws'
};

export { API_BASE_URL, API_ENDPOINTS };

// HTTP Client Configuration
export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  get: (endpoint: string) => apiClient.request(endpoint, { method: 'GET' }),
  post: (endpoint: string, data?: any) => apiClient.request(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  }),
  put: (endpoint: string, data?: any) => apiClient.request(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  }),
  delete: (endpoint: string) => apiClient.request(endpoint, { method: 'DELETE' }),

  // File upload helper
  uploadFile: async (endpoint: string, file: File, fieldName: string = 'file') => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }
};
