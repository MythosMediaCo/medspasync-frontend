import React from 'react';

/**
 * MedSpaSync Pro - Unified Button Component
 * 
 * Provides consistent button styling across all platforms with:
 * - Multiple variants and sizes
 * - Loading states
 * - Accessibility features
 * - Medical environment considerations
 * - Consistent design tokens
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  href,
  target,
  rel,
  onClick,
  className = '',
  ...props
}) => {
  // Base button classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  // Variant classes
  const variantClasses = {
    primary: `
      bg-primary-600 text-white
      hover:bg-primary-700
      focus:ring-primary-500
      active:bg-primary-800
    `,
    secondary: `
      bg-gray-100 text-gray-700 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400
      focus:ring-gray-500
      active:bg-gray-300
    `,
    outline: `
      bg-transparent text-primary-600 border border-primary-600
      hover:bg-primary-50 hover:border-primary-700
      focus:ring-primary-500
      active:bg-primary-100
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500
      active:bg-gray-200
    `,
    danger: `
      bg-error-600 text-white
      hover:bg-error-700
      focus:ring-error-500
      active:bg-error-800
    `,
    success: `
      bg-success-600 text-white
      hover:bg-success-700
      focus:ring-success-500
      active:bg-success-800
    `,
    warning: `
      bg-warning-600 text-white
      hover:bg-warning-700
      focus:ring-warning-500
      active:bg-warning-800
    `,
    medical: `
      bg-primary-600 text-white
      hover:bg-primary-700
      focus:ring-primary-500
      active:bg-primary-800
      shadow-md
    `,
    'medical-secondary': `
      bg-success-600 text-white
      hover:bg-success-700
      focus:ring-success-500
      active:bg-success-800
      shadow-md
    `
  };

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Combined classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Handle click with loading state
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // If href is provided, render as link
  if (href) {
    const linkProps = {
      href,
      target,
      rel: target === '_blank' ? 'noopener noreferrer' : rel,
      className: combinedClasses,
      onClick: handleClick,
      ...props
    };

    return (
      <a {...linkProps}>
        {loading && <LoadingSpinner />}
        {children}
      </a>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={combinedClasses}
      onClick={handleClick}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
};

// Button group component for related buttons
export const ButtonGroup = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`inline-flex rounded-md shadow-sm ${className}`}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${!isFirst ? '-ml-px' : ''}
            ${!isFirst ? 'rounded-l-none' : ''}
            ${!isLast ? 'rounded-r-none' : ''}
            ${!isFirst && !isLast ? 'rounded-none' : ''}
          `.trim().replace(/\s+/g, ' '),
          ...child.props
        });
      })}
    </div>
  );
};

// Icon button component
export const IconButton = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={`${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Icon className={iconSizes[size]} />
      )}
    </Button>
  );
};

// Medical-specific button variants
export const MedicalButton = ({ variant = 'medical', ...props }) => (
  <Button variant={variant} {...props} />
);

export const EmergencyButton = (props) => (
  <Button variant="danger" {...props} />
);

export const SuccessButton = (props) => (
  <Button variant="success" {...props} />
);

export default Button; 