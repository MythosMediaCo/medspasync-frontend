import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * MedSpaSync Pro - Unified Navigation Component
 * 
 * Provides consistent navigation across all platforms with:
 * - Role-based navigation items
 * - Responsive design
 * - Accessibility features
 * - Platform-specific adaptations
 * - Seamless user experience
 */

const Navigation = ({ 
  variant = 'main', // 'main', 'marketing', 'demo'
  showAuth = true,
  className = '',
  onNavigate = () => {}
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll effect for marketing variant
  useEffect(() => {
    if (variant === 'marketing') {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 20);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [variant]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Navigation items based on variant and user role
  const getNavigationItems = () => {
    const baseItems = [];

    switch (variant) {
      case 'main':
        baseItems.push(
          { name: 'Dashboard', href: '/dashboard', icon: 'Home', roles: ['admin', 'manager', 'staff'] },
          { name: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['admin', 'manager'] },
          { name: 'Reconciliation', href: '/reconciliation', icon: 'Zap', roles: ['admin', 'manager', 'staff'] },
          { name: 'Reports', href: '/reports', icon: 'FileText', roles: ['admin', 'manager'] },
          { name: 'Clients', href: '/clients', icon: 'Users', roles: ['admin', 'manager', 'staff'] },
          { name: 'Appointments', href: '/appointments', icon: 'Calendar', roles: ['admin', 'manager', 'staff'] },
          { name: 'Security', href: '/security', icon: 'Shield', roles: ['admin'] },
          { name: 'Performance', href: '/performance', icon: 'Activity', roles: ['admin'] }
        );
        break;

      case 'demo':
        baseItems.push(
          { name: 'Home', href: '/', icon: 'Home' },
          { name: 'Features', href: '/features', icon: 'Star' },
          { name: 'Demo', href: '/demo', icon: 'Play' },
          { name: 'Documentation', href: '/docs', icon: 'Book' }
        );
        break;

      case 'marketing':
        baseItems.push(
          { name: 'Home', href: '/', icon: 'Home' },
          { name: 'Features', href: '/features', icon: 'Star' },
          { name: 'Pricing', href: '/pricing', icon: 'DollarSign' },
          { name: 'About', href: '/about', icon: 'Info' },
          { name: 'Contact', href: '/contact', icon: 'Mail' }
        );
        break;

      default:
        break;
    }

    // Filter items based on user role
    if (isAuthenticated && user?.role) {
      return baseItems.filter(item => 
        !item.roles || item.roles.includes(user.role)
      );
    }

    return baseItems.filter(item => !item.roles);
  };

  const navigationItems = getNavigationItems();

  // Icon mapping
  const getIcon = (iconName) => {
    const icons = {
      Home: '🏠',
      BarChart3: '📊',
      Zap: '⚡',
      FileText: '📄',
      Users: '👥',
      Calendar: '📅',
      Shield: '🛡️',
      Activity: '📈',
      Star: '⭐',
      Play: '▶️',
      Book: '📚',
      DollarSign: '💰',
      Info: 'ℹ️',
      Mail: '✉️',
      Settings: '⚙️',
      LogOut: '🚪'
    };
    return icons[iconName] || '📋';
  };

  // Check if current path is active
  const isActive = (href) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  // Handle navigation click
  const handleNavigation = (href) => {
    onNavigate(href);
    setIsMobileMenuOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      handleNavigation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Render user menu
  const renderUserMenu = () => {
    if (!showAuth || !isAuthenticated) return null;

    return (
      <div className="relative group">
        <button 
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="User menu"
          aria-expanded={false}
          aria-haspopup="true"
        >
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.[0] || user?.name?.[0] || 'U'}
            </span>
          </div>
          <span className="hidden md:block">{user?.firstName || user?.name || 'User'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        <div 
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => handleNavigation('/profile')}
            role="menuitem"
          >
            Profile
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => handleNavigation('/settings')}
            role="menuitem"
          >
            Settings
          </Link>
          <hr className="my-1" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  };

  // Render auth buttons for marketing
  const renderAuthButtons = () => {
    if (!showAuth || isAuthenticated) return null;

    return (
      <div className="flex items-center space-x-4">
        <Link
          to="/login"
          className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={() => handleNavigation('/login')}
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          onClick={() => handleNavigation('/register')}
        >
          Get Started
        </Link>
      </div>
    );
  };

  // Base navigation classes
  const baseClasses = `
    transition-all duration-300
    ${variant === 'marketing' && isScrolled ? 'shadow-sm bg-background-primary/95 backdrop-blur-md' : ''}
    ${className}
  `;

  return (
    <nav className={`nav-header ${baseClasses}`} role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="nav-logo flex items-center space-x-2"
            onClick={() => handleNavigation('/')}
            aria-label="MedSpaSync Pro - Home"
          >
            <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              MedSpaSync Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => handleNavigation(item.href)}
                role="menuitem"
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span className="text-base" aria-hidden="true">{getIcon(item.icon)}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {renderAuthButtons()}
            {renderUserMenu()}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden mt-4 pb-4 border-t border-gray-200"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col space-y-2 pt-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handleNavigation(item.href)}
                  role="menuitem"
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span className="text-lg" aria-hidden="true">{getIcon(item.icon)}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              {showAuth && (
                <div className="pt-4 border-t border-gray-200">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 text-sm text-gray-600">
                        Signed in as {user?.firstName || user?.name || 'User'}
                      </div>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => handleNavigation('/profile')}
                        role="menuitem"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => handleNavigation('/settings')}
                        role="menuitem"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        role="menuitem"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link
                        to="/login"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => handleNavigation('/login')}
                        role="menuitem"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        onClick={() => handleNavigation('/register')}
                        role="menuitem"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 