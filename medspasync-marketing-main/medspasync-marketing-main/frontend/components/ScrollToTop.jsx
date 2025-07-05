import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Enhanced ScrollToTop component for MedSpaSync Pro
 * Handles smooth scrolling with accessibility and performance optimizations
 */
const ScrollToTop = () => {
  const { pathname, hash, search } = useLocation();
  const timeoutRef = useRef(null);
  const previousPathRef = useRef('');

  useEffect(() => {
    // Clear any pending scroll operations
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Determine if this is a route change or just a hash/search change
    const isRouteChange = previousPathRef.current !== pathname;
    const isHashNavigation = hash && !isRouteChange;
    const isSearchChange = search && !isRouteChange && !hash;

    // Store current path for next comparison
    previousPathRef.current = pathname;

    const performScroll = () => {
      try {
        // Priority 1: Hash navigation (anchor links)
        if (hash) {
          const targetId = hash.slice(1); // Remove the #
          const element = document.getElementById(targetId) || 
                         document.querySelector(`[name="${targetId}"]`) ||
                         document.querySelector(hash);
          
          if (element) {
            // Calculate offset for fixed header (adjust based on your header height)
            const headerOffset = 80; // Assuming 80px header height
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              left: 0,
              behavior: scrollBehavior
            });

            // Set focus for accessibility (after scroll completes)
            setTimeout(() => {
              if (element.tabIndex === -1) {
                element.tabIndex = -1;
              }
              element.focus({ preventScroll: true });
            }, prefersReducedMotion ? 0 : 500);

            return;
          } else {
            // Hash target not found, log for debugging in development
            if (process.env.NODE_ENV === 'development') {
              console.warn(`ScrollToTop: Hash target "${hash}" not found`);
            }
          }
        }

        // Priority 2: Route change - scroll to top
        if (isRouteChange) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: scrollBehavior
          });

          // Set focus to main content for accessibility
          setTimeout(() => {
            const mainContent = document.querySelector('main') || 
                              document.querySelector('[role="main"]') ||
                              document.querySelector('#main-content');
            
            if (mainContent) {
              if (mainContent.tabIndex === -1) {
                mainContent.tabIndex = -1;
              }
              mainContent.focus({ preventScroll: true });
            }
          }, prefersReducedMotion ? 0 : 100);
        }

        // Priority 3: Search parameter change (less common, usually stay in place)
        // Don't scroll for search parameter changes unless it's a new route

      } catch (error) {
        // Fallback to instant scroll if smooth scroll fails
        console.warn('ScrollToTop: Smooth scroll failed, using instant scroll', error);
        if (hash) {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ block: 'start' });
          }
        } else if (isRouteChange) {
          window.scrollTo(0, 0);
        }
      }
    };

    // Use multiple RAF for better performance on slower devices
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Small delay for hash navigation to ensure content is rendered
        if (isHashNavigation) {
          timeoutRef.current = setTimeout(performScroll, 100);
        } else {
          performScroll();
        }
      });
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, hash, search]);

  // Effect for handling browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Browser handles scroll restoration, but ensure accessibility focus
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement === document.body) {
          const mainContent = document.querySelector('main') || 
                            document.querySelector('[role="main"]');
          if (mainContent) {
            mainContent.focus({ preventScroll: true });
          }
        }
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
};

export default ScrollToTop;

/**
 * Utility hook for programmatic scrolling within components
 * Usage: const scrollTo = useScrollTo();
 *        scrollTo.top(); or scrollTo.element('#pricing');
 */
export const useScrollTo = () => {
  return {
    // Scroll to top of page
    top: (options = {}) => {
      const { smooth = true, offset = 0 } = options;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      window.scrollTo({
        top: offset,
        left: 0,
        behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto'
      });
    },

    // Scroll to specific element
    element: (selector, options = {}) => {
      const { smooth = true, offset = 80, focus = false } = options;
      const element = document.querySelector(selector);
      
      if (!element) {
        console.warn(`useScrollTo: Element "${selector}" not found`);
        return false;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        left: 0,
        behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto'
      });

      // Optional focus for accessibility
      if (focus) {
        setTimeout(() => {
          if (element.tabIndex === -1) {
            element.tabIndex = -1;
          }
          element.focus({ preventScroll: true });
        }, prefersReducedMotion ? 0 : 500);
      }

      return true;
    },

    // Scroll to pricing section (MedSpaSync Pro specific)
    pricing: () => {
      const pricingElement = document.querySelector('#pricing') || 
                           document.querySelector('[data-section="pricing"]') ||
                           document.querySelector('.pricing-section');
      
      if (pricingElement) {
        return useScrollTo().element('#pricing', { offset: 60, focus: true });
      }
      
      // Fallback: navigate to pricing page
      window.location.href = '/pricing';
      return true;
    },

    // Scroll to demo section (MedSpaSync Pro specific)
    demo: () => {
      const demoElement = document.querySelector('#demo') ||
                         document.querySelector('[data-section="demo"]') ||
                         document.querySelector('.demo-section');
      
      if (demoElement) {
        return useScrollTo().element('#demo', { offset: 60, focus: true });
      }
      
      // Fallback: navigate to demo page
      window.location.href = '/demo';
      return true;
    },

    // Scroll to contact section (MedSpaSync Pro specific)
    contact: () => {
      const contactElement = document.querySelector('#contact') ||
                           document.querySelector('[data-section="contact"]') ||
                           document.querySelector('.contact-section');
      
      if (contactElement) {
        return useScrollTo().element('#contact', { offset: 60, focus: true });
      }
      
      // Fallback: navigate to contact page
      window.location.href = '/contact';
      return true;
    },
  };
};

/**
 * Medical spa specific scroll utilities
 */
export const medSpaScrollUtils = {
  // Scroll to reconciliation demo
  showDemo: () => {
    const scrollTo = useScrollTo();
    return scrollTo.demo() || scrollTo.element('#demo-section');
  },

  // Scroll to pricing with ROI focus
  showPricing: () => {
    const scrollTo = useScrollTo();
    return scrollTo.pricing() || scrollTo.element('#pricing-section');
  },

  // Scroll to implementation timeline
  showImplementation: () => {
    const scrollTo = useScrollTo();
    return scrollTo.element('#implementation') || scrollTo.element('#features');
  },

  // Scroll to support section
  getSupport: () => {
    const scrollTo = useScrollTo();
    return scrollTo.contact() || scrollTo.element('#support-section');
  },
};