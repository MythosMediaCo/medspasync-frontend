import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeTheme } from './theme.js';
import { ToastProvider } from './context/ToastContext';

// Error Boundary Component for Production Resilience
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error for debugging (in production, you might send to error reporting service)
    console.error('MedSpaSync Pro Error:', error, errorInfo);
    
    // Optional: Send error to analytics/monitoring service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="text-6xl mb-6">🔧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Reconciliation System Temporarily Unavailable
              </h2>
              <p className="text-gray-600 mb-8">
                We're experiencing a technical issue. Our team has been notified and is working to restore service.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Reload Application
                </button>
                
                <div className="text-sm text-gray-500">
                  <p>Need immediate help?</p>
                  <a 
                    href="mailto:support@medspasyncpro.com" 
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Contact Support: support@medspasyncpro.com
                  </a>
                </div>
              </div>

              {/* Development error details (only show in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left bg-red-50 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-red-800">
                    Development Error Details
                  </summary>
                  <div className="mt-4 text-sm">
                    <div className="font-medium text-red-800 mb-2">Error:</div>
                    <pre className="bg-red-100 p-2 rounded text-xs overflow-auto">
                      {this.state.error && this.state.error.toString()}
                    </pre>
                    <div className="font-medium text-red-800 mt-4 mb-2">Stack Trace:</div>
                    <pre className="bg-red-100 p-2 rounded text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Application Performance Monitoring
const performanceObserver = () => {
  // Measure Core Web Vitals for user experience optimization
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            // Track page load performance
            console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart, 'ms');
          }
          
          if (entry.entryType === 'paint') {
            // Track First Contentful Paint and Largest Contentful Paint
            console.log(`${entry.name}:`, entry.startTime, 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }
};

// Service Worker Registration for PWA capabilities
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Initialize Application
const initializeApp = () => {
  try {
    // Initialize theme before rendering to prevent flash
    initializeTheme();
    
    // Set up performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      performanceObserver();
    }
    
    // Register service worker for production
    registerServiceWorker();
    
    // Set global meta information
    document.title = 'MedSpaSync Pro | AI Reconciliation for Medical Spas';
    
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewport);
    }
    
    // Preload critical resources
    const preloadFont = document.createElement('link');
    preloadFont.rel = 'preload';
    preloadFont.href = '/fonts/inter-v19-latin-400.woff2';
    preloadFont.as = 'font';
    preloadFont.type = 'font/woff2';
    preloadFont.crossOrigin = 'anonymous';
    document.head.appendChild(preloadFont);

  } catch (error) {
    console.error('App initialization error:', error);
  }
};

// Application Root Component with Context Providers
const AppRoot = () => (
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize and Render Application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}

// Initialize app configuration
initializeApp();

// Create and render React app
try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AppRoot />);
  
  // Log successful initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 MedSpaSync Pro main.jsx initialized successfully');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('React version:', React.version);
  }
  
} catch (error) {
  console.error('Failed to render React app from main.jsx:', error);
  
  // Fallback: Show basic error message if React fails completely
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; font-family: system-ui, sans-serif; background: #f9fafb;">
      <div style="text-align: center; max-width: 400px;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #111827;">
          MedSpaSync Pro Loading Error
        </h1>
        <p style="color: #6b7280; margin-bottom: 2rem;">
          Unable to load the reconciliation platform. Please refresh the page or contact support.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background: #059669; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;"
        >
          Reload Page
        </button>
        <div style="margin-top: 1rem; font-size: 0.875rem; color: #9ca3af;">
          <a href="mailto:support@medspasyncpro.com" style="color: #059669;">support@medspasyncpro.com</a>
        </div>
      </div>
    </div>
  `;
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser error handling
  event.preventDefault();
  
  // Optional: Send to error reporting service
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: `Unhandled Promise: ${event.reason}`,
      fatal: false
    });
  }
});

// Export for testing purposes
export { ErrorBoundary, AppRoot };