// /workspaces/medspasync-marketing/src/theme.js

/**
 * MedSpaSync Pro Theme Management
 * Handles light/dark mode switching with user preference persistence
 * Optimized for medical spa professional interface needs
 */

// Theme constants
const THEME_STORAGE_KEY = 'medspasync-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const THEME_AUTO = 'auto';

// Cache DOM elements for performance
let cachedElements = {
  darkIcon: null,
  lightIcon: null,
  themeToggle: null,
  lastUpdate: 0
};

/**
 * Safely access localStorage with fallback
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if storage fails
 * @returns {string} - Stored value or default
 */
function safeGetStorage(key, defaultValue = null) {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (error) {
    console.warn('Theme: localStorage access failed', error);
    return defaultValue;
  }
}

/**
 * Safely set localStorage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Theme: localStorage write failed', error);
  }
}

/**
 * Gets cached DOM elements or refreshes cache
 * @returns {Object} - Cached DOM elements
 */
function getCachedElements() {
  const now = Date.now();
  
  // Refresh cache every 5 seconds or if elements are missing
  if (now - cachedElements.lastUpdate > 5000 || !cachedElements.darkIcon) {
    cachedElements = {
      darkIcon: document.getElementById('theme-toggle-dark-icon'),
      lightIcon: document.getElementById('theme-toggle-light-icon'),
      themeToggle: document.getElementById('theme-toggle'),
      lastUpdate: now
    };
  }
  
  return cachedElements;
}

/**
 * Determines if dark mode should be active based on user preference and system settings
 * @returns {boolean} - True if dark mode should be active
 */
function shouldUseDarkMode() {
  const savedTheme = safeGetStorage(THEME_STORAGE_KEY);
  
  // Explicit user preference takes priority
  if (savedTheme === THEME_DARK) return true;
  if (savedTheme === THEME_LIGHT) return false;
  
  // Fall back to system preference
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.warn('Theme: matchMedia not supported', error);
    return false; // Default to light mode
  }
}

/**
 * Applies theme to document with smooth transition
 * @param {boolean} isDark - Whether to apply dark mode
 */
function applyTheme(isDark) {
  const html = document.documentElement;
  
  // Add transition class temporarily for smooth theme switching
  html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  
  // Apply or remove dark class
  html.classList.toggle('dark', isDark);
  
  // Update meta theme-color for mobile browsers
  updateThemeColor(isDark);
  
  // Remove transition after animation completes
  setTimeout(() => {
    html.style.transition = '';
  }, 300);
  
  // Update UI elements
  updateThemeIcon();
  updateThemeToggleState(isDark);
}

/**
 * Updates meta theme-color for mobile browser chrome
 * @param {boolean} isDark - Current theme state
 */
function updateThemeColor(isDark) {
  try {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    
    // Use MedSpaSync Pro brand colors
    themeColorMeta.content = isDark ? '#0f172a' : '#ffffff';
  } catch (error) {
    console.warn('Theme: Failed to update theme-color meta tag', error);
  }
}

/**
 * Updates visibility and state of theme toggle icons
 * Handles missing DOM elements gracefully
 */
function updateThemeIcon() {
  const { darkIcon, lightIcon } = getCachedElements();
  
  if (!darkIcon || !lightIcon) {
    // Icons not found, but don't throw error - they might not exist on all pages
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');
  
  try {
    // Show appropriate icon based on current theme
    darkIcon.classList.toggle('hidden', isDark);
    lightIcon.classList.toggle('hidden', !isDark);
    
    // Update ARIA labels for accessibility
    darkIcon.setAttribute('aria-label', 'Switch to dark mode');
    lightIcon.setAttribute('aria-label', 'Switch to light mode');
  } catch (error) {
    console.warn('Theme: Failed to update theme icons', error);
  }
}

/**
 * Updates theme toggle button state for accessibility
 * @param {boolean} isDark - Current theme state
 */
function updateThemeToggleState(isDark) {
  const { themeToggle } = getCachedElements();
  
  if (!themeToggle) return;
  
  try {
    themeToggle.setAttribute('aria-pressed', isDark.toString());
    themeToggle.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  } catch (error) {
    console.warn('Theme: Failed to update toggle state', error);
  }
}

/**
 * Initializes the theme system based on user preference or system settings
 * Called once when the application loads
 */
export function initializeTheme() {
  try {
    const isDark = shouldUseDarkMode();
    applyTheme(isDark);
    
    // Listen for system theme changes
    setupSystemThemeListener();
    
    // Setup keyboard shortcuts for accessibility
    setupKeyboardShortcuts();
    
    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 Theme initialized:', isDark ? 'dark' : 'light');
    }
  } catch (error) {
    console.error('Theme: Initialization failed', error);
    // Ensure we have a fallback theme even if initialization fails
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Toggles between light and dark mode manually
 * Saves user preference and provides smooth transition
 */
export function toggleTheme() {
  try {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains('dark');
    const newTheme = isCurrentlyDark ? THEME_LIGHT : THEME_DARK;
    
    // Apply new theme
    applyTheme(!isCurrentlyDark);
    
    // Save user preference
    safeSetStorage(THEME_STORAGE_KEY, newTheme);
    
    // Announce change for screen readers
    announceThemeChange(!isCurrentlyDark);
    
    // Analytics tracking (if available)
    if (window.gtag) {
      window.gtag('event', 'theme_toggle', {
        theme: newTheme,
        page_title: document.title
      });
    }
    
  } catch (error) {
    console.error('Theme: Toggle failed', error);
  }
}

/**
 * Gets the current theme preference
 * @returns {string} - Current theme (light/dark/auto)
 */
export function getCurrentTheme() {
  return safeGetStorage(THEME_STORAGE_KEY, THEME_AUTO);
}

/**
 * Sets theme preference programmatically
 * @param {string} theme - Theme to set (light/dark/auto)
 */
export function setTheme(theme) {
  if (![THEME_LIGHT, THEME_DARK, THEME_AUTO].includes(theme)) {
    console.warn('Theme: Invalid theme value', theme);
    return;
  }
  
  safeSetStorage(THEME_STORAGE_KEY, theme);
  
  const isDark = theme === THEME_DARK || (theme === THEME_AUTO && shouldUseDarkMode());
  applyTheme(isDark);
}

/**
 * Listens for system theme changes and updates accordingly
 * Only applies if user hasn't set an explicit preference
 */
function setupSystemThemeListener() {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const savedTheme = safeGetStorage(THEME_STORAGE_KEY);
      
      // Only auto-update if user hasn't set explicit preference
      if (!savedTheme || savedTheme === THEME_AUTO) {
        applyTheme(e.matches);
      }
    };
    
    // Use addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  } catch (error) {
    console.warn('Theme: System theme listener setup failed', error);
  }
}

/**
 * Sets up keyboard shortcuts for theme switching (accessibility)
 */
function setupKeyboardShortcuts() {
  try {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + T to toggle theme
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }
    });
  } catch (error) {
    console.warn('Theme: Keyboard shortcuts setup failed', error);
  }
}

/**
 * Announces theme change to screen readers
 * @param {boolean} isDark - New theme state
 */
function announceThemeChange(isDark) {
  try {
    const announcement = `Switched to ${isDark ? 'dark' : 'light'} mode`;
    
    // Create temporary announcement element
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  } catch (error) {
    console.warn('Theme: Screen reader announcement failed', error);
  }
}

/**
 * Prefers reduced motion check for accessibility
 * @returns {boolean} - True if user prefers reduced motion
 */
export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    return false;
  }
}

// Export theme constants for use in components
export const THEMES = {
  LIGHT: THEME_LIGHT,
  DARK: THEME_DARK,
  AUTO: THEME_AUTO
};