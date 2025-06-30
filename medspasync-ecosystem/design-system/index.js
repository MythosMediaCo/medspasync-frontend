/**
 * MedSpaSync Pro - Unified Design System
 * 
 * Main export file for all design system components and utilities.
 * Provides a unified interface for consistent design across all platforms.
 */

// Core Components
export { default as Navigation } from './components/Navigation';
export { default as Button, ButtonGroup, IconButton, MedicalButton, EmergencyButton, SuccessButton } from './components/Button';
export { 
  default as Card, 
  CardHeader, 
  CardTitle, 
  CardSubtitle, 
  CardContent, 
  CardFooter,
  MedicalCard,
  PatientCard,
  TreatmentCard,
  AlertCard,
  CardGrid,
  CardList,
  StatsCard
} from './components/Card';

// Design Tokens
export { default as tokens } from './tokens.css';

// Utility Functions
export const getDesignToken = (tokenName) => {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(`--${tokenName}`).trim();
};

export const setDesignToken = (tokenName, value) => {
  const root = document.documentElement;
  root.style.setProperty(`--${tokenName}`, value);
};

// Theme Utilities
export const themes = {
  light: {
    'bg-primary': '#ffffff',
    'bg-secondary': '#f9fafb',
    'text-primary': '#111827',
    'text-secondary': '#4b5563',
    'border-primary': '#e5e7eb'
  },
  dark: {
    'bg-primary': '#111827',
    'bg-secondary': '#1f2937',
    'text-primary': '#f9fafb',
    'text-secondary': '#d1d5db',
    'border-primary': '#374151'
  },
  medical: {
    'primary-600': '#2563eb',
    'success-600': '#059669',
    'warning-600': '#d97706',
    'error-600': '#dc2626'
  }
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) return;

  Object.entries(theme).forEach(([token, value]) => {
    setDesignToken(token, value);
  });
};

// Responsive Utilities
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const isBreakpoint = (breakpoint) => {
  return window.innerWidth >= breakpoints[breakpoint];
};

export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState('sm');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= breakpoints['2xl']) setCurrentBreakpoint('2xl');
      else if (width >= breakpoints.xl) setCurrentBreakpoint('xl');
      else if (width >= breakpoints.lg) setCurrentBreakpoint('lg');
      else if (width >= breakpoints.md) setCurrentBreakpoint('md');
      else if (width >= breakpoints.sm) setCurrentBreakpoint('sm');
      else setCurrentBreakpoint('xs');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return currentBreakpoint;
};

// Animation Utilities
export const animations = {
  fadeIn: 'fadeIn 0.2s ease-out',
  fadeOut: 'fadeOut 0.2s ease-in',
  slideInRight: 'slideInRight 0.3s ease-out',
  slideInLeft: 'slideInLeft 0.3s ease-out',
  scaleIn: 'scaleIn 0.2s ease-out',
  scaleOut: 'scaleOut 0.2s ease-in'
};

export const applyAnimation = (element, animationName) => {
  if (!element || !animations[animationName]) return;

  element.style.animation = animations[animationName];
  
  const handleAnimationEnd = () => {
    element.style.animation = '';
    element.removeEventListener('animationend', handleAnimationEnd);
  };
  
  element.addEventListener('animationend', handleAnimationEnd);
};

// Accessibility Utilities
export const accessibility = {
  // Focus management
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  },

  // Screen reader announcements
  announce: (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // High contrast mode detection
  isHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Reduced motion detection
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

// Medical-specific Utilities
export const medical = {
  // HIPAA compliance check
  isHIPAACompliant: (data) => {
    // Basic HIPAA compliance check
    const phiFields = ['ssn', 'dob', 'address', 'phone', 'email', 'medical_record'];
    const hasPHI = phiFields.some(field => 
      JSON.stringify(data).toLowerCase().includes(field)
    );
    
    return !hasPHI;
  },

  // Medical priority levels
  priorities: {
    emergency: 'emergency',
    urgent: 'urgent',
    routine: 'routine',
    elective: 'elective'
  },

  // Medical status colors
  getStatusColor: (status) => {
    const statusColors = {
      critical: 'var(--medical-critical)',
      warning: 'var(--medical-warning)',
      stable: 'var(--medical-stable)',
      info: 'var(--medical-info)'
    };
    return statusColors[status] || statusColors.info;
  },

  // Medical data validation
  validateMedicalData: (data) => {
    const errors = [];
    
    if (data.dob) {
      const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
      if (age < 0 || age > 120) {
        errors.push('Invalid date of birth');
      }
    }
    
    if (data.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
        errors.push('Invalid phone number');
      }
    }
    
    return errors;
  }
};

// Performance Utilities
export const performance = {
  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Measure performance
  measure: (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
};

// Export default design system
const DesignSystem = {
  // Components
  Navigation,
  Button,
  Card,
  
  // Utilities
  getDesignToken,
  setDesignToken,
  applyTheme,
  useBreakpoint,
  applyAnimation,
  accessibility,
  medical,
  performance,
  
  // Constants
  breakpoints,
  themes,
  animations
};

export default DesignSystem; 