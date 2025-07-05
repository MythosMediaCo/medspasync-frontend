import React from 'react';

/**
 * MedSpaSync Pro - Unified Card Component
 * 
 * Provides consistent card styling across all platforms with:
 * - Multiple variants and layouts
 * - Interactive states
 * - Medical-specific styling
 * - Accessibility features
 * - Consistent design tokens
 */

const Card = ({
  children,
  variant = 'default',
  padding = 'default',
  interactive = false,
  loading = false,
  disabled = false,
  onClick,
  href,
  target,
  rel,
  className = '',
  ...props
}) => {
  // Base card classes
  const baseClasses = `
    bg-white border border-gray-200 rounded-lg
    transition-all duration-200 ease-out
    ${interactive ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  // Variant classes
  const variantClasses = {
    default: `
      shadow-sm
      ${interactive ? 'hover:shadow-md hover:border-gray-300' : ''}
    `,
    elevated: `
      shadow-md
      ${interactive ? 'hover:shadow-lg' : ''}
    `,
    outline: `
      border-2 border-gray-200
      ${interactive ? 'hover:border-primary-300' : ''}
    `,
    medical: `
      shadow-md border-primary-100
      ${interactive ? 'hover:shadow-lg hover:border-primary-200' : ''}
    `,
    'medical-elevated': `
      shadow-lg border-primary-200 bg-primary-50/30
      ${interactive ? 'hover:shadow-xl hover:border-primary-300' : ''}
    `,
    success: `
      shadow-md border-success-100 bg-success-50/30
      ${interactive ? 'hover:shadow-lg hover:border-success-200' : ''}
    `,
    warning: `
      shadow-md border-warning-100 bg-warning-50/30
      ${interactive ? 'hover:shadow-lg hover:border-warning-200' : ''}
    `,
    error: `
      shadow-md border-error-100 bg-error-50/30
      ${interactive ? 'hover:shadow-lg hover:border-error-200' : ''}
    `,
    info: `
      shadow-md border-primary-100 bg-primary-50/30
      ${interactive ? 'hover:shadow-lg hover:border-primary-200' : ''}
    `
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  // Loading overlay
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    </div>
  );

  // Combined classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.default}
    ${paddingClasses[padding] || paddingClasses.default}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Handle click
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // Card content wrapper
  const CardContent = ({ children }) => (
    <div className="relative">
      {loading && <LoadingOverlay />}
      {children}
    </div>
  );

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
        <CardContent>{children}</CardContent>
      </a>
    );
  }

  // Render as div with optional click handler
  return (
    <div
      className={combinedClasses}
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      } : undefined}
      {...props}
    >
      <CardContent>{children}</CardContent>
    </div>
  );
};

// Card header component
export const CardHeader = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`border-b border-gray-200 pb-4 mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Card title component
export const CardTitle = ({
  children,
  as: Component = 'h3',
  className = '',
  ...props
}) => (
  <Component
    className={`text-lg font-semibold text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </Component>
);

// Card subtitle component
export const CardSubtitle = ({
  children,
  className = '',
  ...props
}) => (
  <p
    className={`text-sm text-gray-600 mt-1 ${className}`}
    {...props}
  >
    {children}
  </p>
);

// Card content component
export const CardContent = ({
  children,
  className = '',
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

// Card footer component
export const CardFooter = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`border-t border-gray-200 pt-4 mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Medical-specific card variants
export const MedicalCard = ({ variant = 'medical', ...props }) => (
  <Card variant={variant} {...props} />
);

export const PatientCard = (props) => (
  <Card variant="medical" {...props} />
);

export const TreatmentCard = (props) => (
  <Card variant="medical-elevated" {...props} />
);

export const AlertCard = ({ type = 'info', ...props }) => (
  <Card variant={type} {...props} />
);

// Card grid component for layouts
export const CardGrid = ({
  children,
  columns = 1,
  gap = 'default',
  className = '',
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10'
  };

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div
      className={`
        grid ${gridClasses[columns] || gridClasses[1]}
        ${gapClasses[gap] || gapClasses.default}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
};

// Card list component for stacked layouts
export const CardList = ({
  children,
  gap = 'default',
  className = '',
  ...props
}) => {
  const gapClasses = {
    sm: 'space-y-3',
    default: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  return (
    <div
      className={`${gapClasses[gap] || gapClasses.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stats card component for metrics
export const StatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon: Icon,
  className = '',
  ...props
}) => {
  const changeClasses = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-gray-600'
  };

  const changeIcon = {
    positive: '↗',
    negative: '↘',
    neutral: '→'
  };

  return (
    <Card className={className} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeClasses[changeType]}`}>
              {changeIcon[changeType]} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-primary-100 rounded-lg">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card; 