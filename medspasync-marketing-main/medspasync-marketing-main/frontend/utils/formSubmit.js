// form.js - MedSpaSync Pro Form Utilities
// Enhanced for medical spa platform with compliance and user experience focus

/**
 * Enhanced form submission helper for medical spa platform
 * @param {Object} options
 * @param {string} options.endpoint - The API endpoint to POST to
 * @param {Object} options.data - Payload to send
 * @param {Object} options.config - Additional configuration
 * @param {number} options.config.timeout - Request timeout in milliseconds (default: 10000)
 * @param {boolean} options.config.validateData - Whether to validate data before sending (default: true)
 * @param {Function} options.config.onProgress - Progress callback for file uploads
 * @param {AbortSignal} options.config.signal - AbortSignal for request cancellation
 * @returns {Promise<Object>} - Parsed response with enhanced error handling
 */
export async function submitForm({ 
  endpoint, 
  data, 
  config = {} 
}) {
  const {
    timeout = 10000,
    validateData = true,
    onProgress,
    signal,
    headers = {},
  } = config;

  // Validation
  if (!endpoint || typeof endpoint !== 'string') {
    throw new FormError('Missing or invalid endpoint.', 'INVALID_ENDPOINT');
  }

  if (validateData && !isValidFormData(data)) {
    throw new FormError('Invalid form data provided.', 'INVALID_DATA');
  }

  // Create timeout signal if not provided
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
  
  // Combine signals if both provided
  const combinedSignal = signal 
    ? combineAbortSignals([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    // Prepare request configuration
    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'MedSpaSync Pro',
        'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0',
        ...headers,
      },
      body: JSON.stringify(sanitizeFormData(data || {})),
      signal: combinedSignal,
    };

    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      requestConfig.headers['X-CSRF-Token'] = csrfToken;
    }

    // Make request with progress tracking
    const response = await fetchWithProgress(endpoint, requestConfig, onProgress);

    // Clear timeout
    clearTimeout(timeoutId);

    // Enhanced response handling
    return await handleResponse(response, endpoint);

  } catch (err) {
    clearTimeout(timeoutId);
    
    // Enhanced error handling with user-friendly messages
    if (err.name === 'AbortError') {
      throw new FormError(
        'Request timed out. Please check your connection and try again.',
        'TIMEOUT',
        { timeout, endpoint }
      );
    }

    if (err instanceof FormError) {
      throw err;
    }

    // Network or other errors
    console.error('[submitForm] Unexpected error:', err);
    throw new FormError(
      'Unable to submit form. Please check your connection and try again.',
      'NETWORK_ERROR',
      { originalError: err.message, endpoint }
    );
  }
}

/**
 * Enhanced form error class for better error handling
 */
export class FormError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'FormError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly error message based on context
   */
  getUserMessage() {
    const contextMessages = {
      'TIMEOUT': 'The request took too long. Please try again.',
      'VALIDATION_ERROR': 'Please check your information and try again.',
      'NETWORK_ERROR': 'Connection problem. Please check your internet and retry.',
      'SERVER_ERROR': 'Server temporarily unavailable. Please try again in a moment.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment before trying again.',
      'INVALID_DATA': 'Please fill out all required fields correctly.',
    };

    return contextMessages[this.code] || this.message;
  }
}

/**
 * Medical spa specific form submission handlers
 */
export const medSpaForms = {
  /**
   * Contact form submission with medical spa context
   */
  contact: async (formData) => {
    const data = {
      ...formData,
      source: 'medspasync_marketing',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };

    return submitForm({
      endpoint: '/api/contact',
      data,
      config: {
        timeout: 15000,
        headers: {
          'X-Form-Type': 'contact',
          'X-Expected-Response-Time': '24-hours',
        },
      },
    });
  },

  /**
   * Demo request submission
   */
  demoRequest: async (formData) => {
    const data = {
      ...formData,
      platform: 'web',
      requestType: 'live_demo',
      timestamp: new Date().toISOString(),
    };

    return submitForm({
      endpoint: '/api/demo-request',
      data,
      config: {
        timeout: 10000,
        headers: {
          'X-Form-Type': 'demo-request',
        },
      },
    });
  },

  /**
   * Newsletter subscription
   */
  newsletter: async (email, preferences = {}) => {
    const data = {
      email,
      preferences: {
        reconciliationTips: true,
        productUpdates: true,
        industryInsights: true,
        ...preferences,
      },
      source: 'website',
      subscriptionDate: new Date().toISOString(),
    };

    return submitForm({
      endpoint: '/api/newsletter',
      data,
      config: {
        timeout: 8000,
        headers: {
          'X-Form-Type': 'newsletter',
        },
      },
    });
  },

  /**
   * Trial signup submission
   */
  trialSignup: async (formData) => {
    const data = {
      ...formData,
      trialType: 'core',
      trialDuration: '30-days',
      source: 'marketing_site',
      signupTimestamp: new Date().toISOString(),
    };

    return submitForm({
      endpoint: '/api/trial-signup',
      data,
      config: {
        timeout: 20000,
        headers: {
          'X-Form-Type': 'trial-signup',
          'X-Expected-Setup-Time': '24-hours',
        },
      },
    });
  },
};

/**
 * Enhanced response handling with medical spa context
 */
async function handleResponse(response, endpoint) {
  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');

  let responseBody;
  
  try {
    responseBody = isJson ? await response.json() : await response.text();
  } catch (parseError) {
    throw new FormError(
      'Invalid response from server.',
      'PARSE_ERROR',
      { parseError: parseError.message, endpoint }
    );
  }

  if (!response.ok) {
    // Handle specific HTTP status codes
    const errorHandlers = {
      400: () => new FormError(
        responseBody?.message || 'Please check your information and try again.',
        'VALIDATION_ERROR',
        { status: 400, responseBody }
      ),
      401: () => new FormError(
        'Authentication required. Please refresh and try again.',
        'AUTH_ERROR',
        { status: 401 }
      ),
      403: () => new FormError(
        'Access denied. Please contact support if this persists.',
        'ACCESS_DENIED',
        { status: 403 }
      ),
      429: () => new FormError(
        'Too many requests. Please wait a moment before trying again.',
        'RATE_LIMITED',
        { status: 429, retryAfter: response.headers.get('Retry-After') }
      ),
      500: () => new FormError(
        'Server error. Our team has been notified. Please try again in a moment.',
        'SERVER_ERROR',
        { status: 500 }
      ),
    };

    const errorHandler = errorHandlers[response.status];
    if (errorHandler) {
      throw errorHandler();
    }

    // Generic error for other status codes
    const errorMessage = typeof responseBody === 'string'
      ? responseBody
      : responseBody?.message || `Request failed with status ${response.status}`;
    
    throw new FormError(errorMessage, 'HTTP_ERROR', {
      status: response.status,
      responseBody
    });
  }

  return responseBody;
}

/**
 * Validate form data for medical spa compliance
 */
function isValidFormData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for potentially sensitive data that shouldn't be in forms
  const sensitiveFields = ['ssn', 'social_security', 'medical_record', 'patient_id'];
  const dataKeys = Object.keys(data).map(key => key.toLowerCase());
  
  return !sensitiveFields.some(field => 
    dataKeys.some(key => key.includes(field))
  );
}

/**
 * Sanitize form data to prevent XSS and ensure compliance
 */
function sanitizeFormData(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? item.trim() : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Get CSRF token if available
 */
function getCSRFToken() {
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try to get from cookie
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Combine multiple AbortSignals
 */
function combineAbortSignals(signals) {
  const controller = new AbortController();
  
  signals.forEach(signal => {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort());
    }
  });
  
  return controller.signal;
}

/**
 * Fetch with progress tracking for file uploads
 */
async function fetchWithProgress(url, config, onProgress) {
  if (!onProgress) {
    return fetch(url, config);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete, event.loaded, event.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(xhr.getAllResponseHeaders()),
        });
        resolve(response);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Request aborted'));
    });

    // Handle abort signal
    if (config.signal) {
      config.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.open(config.method || 'GET', url);
    
    // Set headers
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.send(config.body);
  });
}

/**
 * Form validation utilities for medical spa forms
 */
export const formValidation = {
  /**
   * Validate email address
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (flexible format)
   */
  phone: (phone) => {
    const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate spa name (no sensitive medical terms)
   */
  spaName: (name) => {
    const sensitiveTerms = ['patient', 'medical record', 'hipaa'];
    const lowerName = name.toLowerCase();
    return !sensitiveTerms.some(term => lowerName.includes(term));
  },

  /**
   * Validate required fields
   */
  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  /**
   * Validate message length for contact forms
   */
  messageLength: (message, min = 10, max = 1000) => {
    return message.length >= min && message.length <= max;
  },
};

/**
 * Form success handlers for medical spa context
 */
export const formSuccessHandlers = {
  contact: (response) => ({
    title: 'Message Sent Successfully',
    message: 'Thanks for reaching out! Our operations experts will respond within 24 hours with actionable solutions.',
    action: 'Try Live Demo',
    actionUrl: '/demo',
  }),

  demoRequest: (response) => ({
    title: 'Demo Access Granted',
    message: 'Check your email for demo instructions. See 95%+ AI accuracy in action with your own data.',
    action: 'Start Demo Now',
    actionUrl: 'https://app.medspasyncpro.com/demo',
  }),

  newsletter: (response) => ({
    title: 'Subscription Confirmed', 
    message: 'You\'ll receive weekly insights on medical spa reconciliation and operational optimization.',
    action: 'Read Latest Insights',
    actionUrl: '/insights',
  }),

  trialSignup: (response) => ({
    title: 'Trial Account Created',
    message: 'Welcome to MedSpaSync Pro! You\'ll receive setup instructions within 24 hours to start eliminating manual reconciliation.',
    action: 'View Account',
    actionUrl: response.accountUrl || 'https://app.medspasyncpro.com',
  }),
};