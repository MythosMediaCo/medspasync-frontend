// src/utils/constants.js

// Smart API Base URL that handles GitHub Codespaces
const getAPIBaseURL = () => {
  // First, check for explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check if we're in GitHub Codespaces
  if (typeof window !== 'undefined' && window.location.hostname.includes('.app.github.dev')) {
    // Extract the codespace name from the current URL
    const currentHost = window.location.hostname;
    const codespaceName = currentHost.split('-').slice(0, -1).join('-');
    // Construct the backend URL (assuming backend runs on port 5000)
    return `https://${codespaceName}-5000.app.github.dev`;
  }
  
  // Default to localhost for local development
  return 'http://localhost:5000';
};

export const API_BASE_URL = getAPIBaseURL();

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        REFRESH: '/api/auth/refresh',
        LOGOUT: '/api/auth/logout',
        PROFILE: '/api/auth/profile',
        ME: '/api/auth/me',
        DEMO: '/api/auth/demo'
    },
    CLIENTS: {
        LIST: '/api/clients',
        CREATE: '/api/clients',
        UPDATE: '/api/clients',
        DELETE: '/api/clients',
        SEARCH: '/api/clients/search'
    },
    APPOINTMENTS: {
        LIST: '/api/appointments',
        CREATE: '/api/appointments',
        UPDATE: '/api/appointments',
        DELETE: '/api/appointments',
        TODAY: '/api/appointments/today'
    },
    PAYMENTS: {
        LIST: '/api/payments',
        CREATE: '/api/payments',
        PROCESS: '/api/payments/process',
        RECONCILE: '/api/payments/reconcile'
    },
    DASHBOARD: {
        STATS: '/api/dashboard/stats',
        RECENT_ACTIVITY: '/api/dashboard/recent'
    }
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'medspasync_auth_token',
    REFRESH_TOKEN: 'medspasync_refresh_token',
    USER_DATA: 'medspasync_user_data',
    LAST_ACTIVITY: 'medspasync_last_activity',
    THEME: 'medspasync_theme',
    SETTINGS: 'medspasync_settings'
};

export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    RECEPTIONIST: 'receptionist'
};

export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no-show'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

export const CLIENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    VIP: 'vip',
    BLOCKED: 'blocked'
};

// Debug logging to see what URL is being used
if (import.meta.env.MODE !== 'production') {
  console.log('API_BASE_URL:', API_BASE_URL);
}
