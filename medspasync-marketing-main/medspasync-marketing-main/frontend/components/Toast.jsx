import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Enhanced Toast component for MedSpaSync Pro
 * Provides professional notifications with medical spa context
 */
export default function Toast({ 
  message, 
  type = 'success', 
  show, 
  onClose, 
  duration = 4000,
  position = 'top-right',
  persistent = false,
  actions = null,
  title = null,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for smooth entrance animation
      const showTimer = setTimeout(() => setIsVisible(true), 50);
      
      // Auto-dismiss timer (unless persistent)
      let dismissTimer;
      if (!persistent && duration > 0) {
        dismissTimer = setTimeout(() => {
          handleClose();
        }, duration);
      }

      return () => {
        clearTimeout(showTimer);
        if (dismissTimer) clearTimeout(dismissTimer);
      };
    } else {
      setIsVisible(false);
      setIsLeaving(false);
    }
  }, [show, duration, persistent]);

  const handleClose = () => {
    setIsLeaving(true);
    // Wait for exit animation before calling onClose
    setTimeout(() => {
      onClose();
      setIsVisible(false);
      setIsLeaving(false);
    }, 300);
  };

  if (!show) return null;

  // Enhanced styling system
  const getToastStyles = (type) => {
    const styles = {
      success: {
        bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        border: 'border-emerald-400',
        icon: '✅',
        iconBg: 'bg-emerald-400',
      },
      error: {
        bg: 'bg-gradient-to-r from-red-500 to-red-600', 
        border: 'border-red-400',
        icon: '❌',
        iconBg: 'bg-red-400',
      },
      warning: {
        bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
        border: 'border-orange-400', 
        icon: '⚠️',
        iconBg: 'bg-orange-400',
      },
      info: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        border: 'border-blue-400',
        icon: 'ℹ️',
        iconBg: 'bg-blue-400',
      },
      // Medical spa specific types
      demo: {
        bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        border: 'border-indigo-400',
        icon: '🎯',
        iconBg: 'bg-indigo-400',
      },
      reconciliation: {
        bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        border: 'border-emerald-400',
        icon: '🧠',
        iconBg: 'bg-emerald-400',
      },
      contact: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        border: 'border-blue-400',
        icon: '📧',
        iconBg: 'bg-blue-400',
      },
    };

    return styles[type] || styles.info;
  };

  // Position classes
  const getPositionClasses = (position) => {
    const positions = {
      'top-right': 'top-20 right-4',
      'top-left': 'top-20 left-4',
      'top-center': 'top-20 left-1/2 transform -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    };
    return positions[position] || positions['top-right'];
  };

  const styles = getToastStyles(type);
  const positionClasses = getPositionClasses(position);

  // Animation classes
  const animationClasses = isLeaving
    ? 'opacity-0 transform translate-x-full scale-95'
    : isVisible
    ? 'opacity-100 transform translate-x-0 scale-100'
    : 'opacity-0 transform translate-x-full scale-95';

  return (
    <div
      className={`
        fixed ${positionClasses} z-50 max-w-sm w-full mx-auto
        transition-all duration-300 ease-in-out
        ${animationClasses}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`
          ${styles.bg} text-white rounded-xl shadow-xl border ${styles.border}
          backdrop-blur-sm bg-opacity-95
          p-4 relative overflow-hidden
        `}
      >
        {/* Progress bar for auto-dismiss */}
        {!persistent && duration > 0 && (
          <div 
            className="absolute top-0 left-0 h-1 bg-white bg-opacity-30 rounded-full"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
              width: '100%',
            }}
          />
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`
            ${styles.iconBg} rounded-full p-1 mt-0.5 flex-shrink-0
            ring-2 ring-white ring-opacity-30
          `}>
            <span className="text-sm">{styles.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-white mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm text-white leading-relaxed">
              {message}
            </p>

            {/* Action buttons */}
            {actions && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-md
                      bg-white bg-opacity-20 hover:bg-opacity-30
                      transition-colors duration-200
                      ${action.primary ? 'ring-1 ring-white ring-opacity-40' : ''}
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="
              flex-shrink-0 text-white hover:text-gray-200
              transition-colors duration-200 p-1 rounded-md
              hover:bg-white hover:bg-opacity-20
            "
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf([
    'success', 'error', 'warning', 'info', 
    'demo', 'reconciliation', 'contact' // Medical spa specific types
  ]),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number, // 0 means no auto-dismiss
  position: PropTypes.oneOf([
    'top-right', 'top-left', 'top-center',
    'bottom-right', 'bottom-left', 'bottom-center'
  ]),
  persistent: PropTypes.bool, // Don't auto-dismiss
  title: PropTypes.string, // Optional title
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    primary: PropTypes.bool,
  })),
};

Toast.defaultProps = {
  type: 'success',
  duration: 4000,
  position: 'top-right',
  persistent: false,
  title: null,
  actions: null,
};

/**
 * Medical spa specific toast presets
 */
export const medSpaToasts = {
  // Demo completion
  demoComplete: (matches) => ({
    type: 'demo',
    title: 'AI Matching Complete',
    message: `Found ${matches} matches with 95%+ accuracy. See how MedSpaSync Pro eliminates manual reconciliation.`,
    duration: 6000,
    actions: [
      {
        label: 'Try Another Demo',
        onClick: () => window.location.reload(),
      },
      {
        label: 'Start Trial',
        onClick: () => window.location.href = '/pricing',
        primary: true,
      },
    ],
  }),

  // Contact form success
  contactSuccess: () => ({
    type: 'contact', 
    title: 'Message Sent Successfully',
    message: 'Our operations experts will respond within 24 hours with actionable solutions.',
    duration: 5000,
    actions: [
      {
        label: 'Try Demo',
        onClick: () => window.location.href = '/demo',
        primary: true,
      },
    ],
  }),

  // Reconciliation processing
  reconciliationProcessing: () => ({
    type: 'reconciliation',
    title: 'AI Processing Your Data',
    message: 'Intelligent matching in progress. This usually takes 15-30 seconds.',
    persistent: true,
  }),

  // Reconciliation success  
  reconciliationSuccess: (timesSaved) => ({
    type: 'reconciliation',
    title: 'Reconciliation Complete',
    message: `Saved ${timesSaved} hours of manual work with intelligent AI matching.`,
    duration: 5000,
  }),

  // Trial signup success
  trialSuccess: () => ({
    type: 'success',
    title: 'Trial Account Created',
    message: 'Welcome to MedSpaSync Pro! Setup instructions sent to your email.',
    duration: 6000,
    actions: [
      {
        label: 'Access Account',
        onClick: () => window.open('https://app.medspasyncpro.com', '_blank'),
        primary: true,
      },
    ],
  }),

  // Error with support contact
  systemError: () => ({
    type: 'error',
    title: 'System Temporarily Unavailable',
    message: 'Please try again. If this persists, contact support@medspasyncpro.com',
    duration: 7000,
    actions: [
      {
        label: 'Contact Support',
        onClick: () => window.location.href = '/contact',
      },
    ],
  }),

  // Newsletter subscription
  newsletterSuccess: () => ({
    type: 'success',
    title: 'Subscription Confirmed',
    message: 'You\'ll receive weekly insights on medical spa reconciliation optimization.',
    duration: 4000,
    actions: [
      {
        label: 'Read Insights',
        onClick: () => window.location.href = '/insights',
      },
    ],
  }),
};