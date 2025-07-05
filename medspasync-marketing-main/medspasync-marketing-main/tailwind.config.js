/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html', 
    './src/**/*.{js,jsx,ts,tsx}',
    './public/**/*.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // MedSpaSync Pro - "This Actually Matters" Design System
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      
      // "This Actually Matters" Color Palette
      colors: {
        // Primary Brand Colors
        brand: {
          primary: '#1a365d', // Deep, rich navy - trustworthy but not clinical
          secondary: '#faf9f6', // Warm cream - human, not sterile
          accent: '#ff6b35', // Warm coral - energetic, approachable, human
          'accent-light': '#ff8a65', // Lighter coral for hover states
        },
        
        // Supporting Colors
        success: '#059669', // Keep success green but warmer
        warning: '#f59e0b', // Warm amber
        error: '#dc2626', // Warmer red
        info: '#3b82f6', // Keep blue for info
        
        // "Real Impact" Neutral Palette - Warmer, More Human
        neutral: {
          50: '#faf9f6', // Warmest white
          100: '#f5f4f1', // Very warm light gray
          200: '#e8e6e1', // Warm light gray
          300: '#d1cec7', // Warm medium light gray
          400: '#a8a59e', // Warm medium gray
          500: '#7a7770', // Warm medium dark gray
          600: '#5a5750', // Warm dark gray
          700: '#2d3748', // Warm charcoal - main text
          800: '#1a202c', // Very dark warm gray
          900: '#171923', // Almost black but warm
        },
        
        // Background Colors - Human, Not Clinical
        background: {
          primary: '#faf9f6', // Warm cream background
          secondary: '#f5f4f1', // Slightly darker warm background
          cards: '#ffffff', // Pure white for cards
          overlay: 'rgba(26, 54, 93, 0.8)', // Navy overlay
        },
        
        // Legacy support for existing components
        grey: {
          50: '#faf9f6',
          100: '#f5f4f1',
          200: '#e8e6e1',
          300: '#d1cec7',
          400: '#a8a59e',
          500: '#7a7770',
          600: '#5a5750',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        },
        
        // MedSpaSync Pro Specific Colors (keeping for content)
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5', 
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe', 
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        
        // New color shortcuts for the aesthetic
        '1a365d': '#1a365d', // Navy primary
        'ff6b35': '#ff6b35', // Coral accent
        'ff8a65': '#ff8a65', // Light coral
        '2d3748': '#2d3748', // Dark navy
      },
      
      // "This Actually Matters" 8px Base Unit System with More Generous Spacing
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '80px',
        '5xl': '96px',
        '6xl': '128px',
        '7xl': '160px',
        '8xl': '192px',
        // Semantic spacing - More generous for "Matters" feel
        'card-padding': '40px',
        'card-spacing': '32px',
        'section-padding': '100px',
        'container-padding': '32px',
        'grid-gap': '32px',
        'data-label-spacing': '12px',
      },
      
      // "Authentic Voice" Typography Scale - More Dramatic
      fontSize: {
        // Hero and Display - More confident
        'hero': ['4.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }],
        'display-large': ['3.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }],
        'display-medium': ['2.75rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.015em' }],
        
        // Titles - More prominent
        'title-large': ['1.875rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-medium': ['1.5rem', { lineHeight: '1.5', fontWeight: '600' }],
        
        // Body - More readable
        'body-large': ['1.25rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-small': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        
        // Labels and Captions - More confident
        'label': ['0.875rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
        
        // Legacy support
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      // "This Actually Matters" Box Shadows - More Dramatic, Less Clinical
      boxShadow: {
        'sm': '0 4px 16px rgba(26, 54, 93, 0.08)', // Navy-tinted shadows
        'md': '0 8px 32px rgba(26, 54, 93, 0.12)', // More dramatic
        'lg': '0 16px 48px rgba(26, 54, 93, 0.16)', // Very dramatic
        'xl': '0 24px 64px rgba(26, 54, 93, 0.2)', // Maximum drama
        // "This Actually Matters" specific shadows
        'card': '0 8px 32px rgba(26, 54, 93, 0.1)', // Navy card shadows
        'card-hover': '0 16px 48px rgba(26, 54, 93, 0.15)', // More dramatic hover
        'data-card': '0 12px 40px rgba(26, 54, 93, 0.14)', // Navy data card shadows
        'button': '0 6px 20px rgba(255, 107, 53, 0.25)', // Coral button shadows
        'button-hover': '0 12px 32px rgba(255, 107, 53, 0.35)', // More dramatic coral hover
      },
      
      // "This Actually Matters" Border Radius - More Human, Less Clinical
      borderRadius: {
        'sm': '12px', // Slightly larger
        'md': '16px', // More generous
        'lg': '20px', // More human
        'xl': '24px', // More generous
        '2xl': '32px', // Very generous
        '3xl': '40px', // Maximum generosity
        // "This Actually Matters" specific
        'card': '24px', // More generous cards
        'data-card': '28px', // More generous data cards
        'button': '16px', // More generous buttons
        'input': '16px', // More generous inputs
      },
      
      // "This Actually Matters" Layout - More Generous for "Matters" Feel
      maxWidth: {
        'container': '1440px',
        'content': '1200px',
        'hero': '1200px',
        'card-grid': '1200px',
      },
      
      // Function Health Grid
      gridTemplateColumns: {
        'data-cards': 'repeat(auto-fit, minmax(300px, 1fr))',
        'test-categories': 'repeat(auto-fit, minmax(280px, 1fr))',
      },
      
      // Function Health Aspect Ratios
      aspectRatio: {
        'data-card': '3/4',
        'hero-card': '4/3',
      },
      
      // Function Health Z-Index
      zIndex: {
        'overlay': '1',
        'content': '2',
        'navigation': '100',
        'modal': '1000',
      },
      
      // Function Health Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      
      // Function Health Animations
      keyframes: {
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scaleIn': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      animation: {
        'fadeIn': 'fadeIn 0.6s ease-out',
        'slideUp': 'slideUp 0.6s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      
      // Function Health Transitions
      transitionDuration: {
        'fast': '0.2s',
        'normal': '0.3s',
        'slow': '0.5s',
      },
      
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  
  plugins: [
    // Function Health Component Classes
    function({ addComponents, theme }) {
      addComponents({
        // Function Health Data Visualization Cards
        '.data-card': {
          background: 'image with overlay',
          borderRadius: theme('borderRadius.data-card'),
          padding: theme('spacing.card-padding'),
          position: 'relative',
          overflow: 'hidden',
          minHeight: '400px',
          aspectRatio: '3/4',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: theme('boxShadow.data-card'),
          },
        },
        
        '.data-card-overlay': {
          background: 'rgba(0, 0, 0, 0.3)',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          zIndex: theme('zIndex.overlay'),
        },
        
        '.data-card-content': {
          position: 'relative',
          zIndex: theme('zIndex.content'),
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
        },
        
        '.data-value': {
          fontSize: theme('fontSize.display-large[0]'),
          fontWeight: theme('fontSize.display-large[1].fontWeight'),
          lineHeight: theme('fontSize.display-large[1].lineHeight'),
          marginBottom: theme('spacing.data-label-spacing'),
        },
        
        '.data-unit': {
          fontSize: theme('fontSize.body-large[0]'),
          fontWeight: theme('fontSize.body-large[1].fontWeight'),
          opacity: '0.9',
        },
        
        '.data-label': {
          fontSize: theme('fontSize.title-medium[0]'),
          fontWeight: theme('fontSize.title-medium[1].fontWeight'),
          marginBottom: theme('spacing.md'),
        },
        
        // Function Health Buttons
        '.btn-primary': {
          background: theme('colors.brand.accent'),
          color: theme('colors.brand.secondary'),
          padding: '16px 32px',
          borderRadius: theme('borderRadius.button'),
          fontSize: theme('fontSize.body[0]'),
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: '#C17D5F',
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.button-hover'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(212, 148, 122, 0.1)',
          },
        },
        
        '.btn-secondary': {
          background: 'transparent',
          color: theme('colors.brand.accent'),
          padding: '16px 32px',
          borderRadius: theme('borderRadius.button'),
          fontSize: theme('fontSize.body[0]'),
          fontWeight: '500',
          border: '2px solid',
          borderColor: theme('colors.brand.accent'),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: theme('colors.brand.accent'),
            color: theme('colors.brand.secondary'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(212, 148, 122, 0.1)',
          },
        },
        
        '.btn-ghost': {
          background: 'transparent',
          color: theme('colors.neutral.500'),
          padding: '12px 24px',
          borderRadius: theme('borderRadius.sm'),
          fontSize: theme('fontSize.body-small[0]'),
          fontWeight: '500',
          border: '1px solid',
          borderColor: theme('colors.neutral.200'),
          transition: 'all 0.2s ease',
          '&:hover': {
            background: theme('colors.neutral.100'),
            borderColor: theme('colors.neutral.300'),
          },
        },
        
        // Function Health Cards
        '.info-card': {
          background: theme('colors.background.cards'),
          borderRadius: theme('borderRadius.card'),
          padding: '40px 32px',
          boxShadow: theme('boxShadow.card'),
          border: '1px solid',
          borderColor: theme('colors.neutral.100'),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme('boxShadow.card-hover'),
          },
        },
        
        '.test-category': {
          background: theme('colors.background.cards'),
          borderRadius: theme('borderRadius.lg'),
          padding: '32px 24px',
          textAlign: 'center',
          border: '1px solid',
          borderColor: theme('colors.neutral.100'),
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme('colors.brand.accent'),
            transform: 'translateY(-2px)',
          },
        },
        
        // Function Health Navigation
        '.nav-header': {
          background: theme('colors.background.primary'),
          padding: '20px 0',
          position: 'sticky',
          top: '0',
          zIndex: theme('zIndex.navigation'),
          borderBottom: '1px solid',
          borderColor: theme('colors.neutral.100'),
        },
        
        '.nav-link': {
          fontSize: theme('fontSize.body[0]'),
          fontWeight: '500',
          color: theme('colors.neutral.700'),
          textDecoration: 'none',
          padding: '8px 16px',
          borderRadius: theme('borderRadius.sm'),
          transition: 'all 0.2s ease',
          '&:hover': {
            color: theme('colors.brand.accent'),
            background: theme('colors.neutral.100'),
          },
          '&.active': {
            color: theme('colors.brand.accent'),
            background: '#FEF7F3',
          },
        },
        
        // Function Health Forms
        '.form-input': {
          padding: '16px 20px',
          borderRadius: theme('borderRadius.input'),
          border: '2px solid',
          borderColor: theme('colors.neutral.200'),
          fontSize: theme('fontSize.body[0]'),
          fontFamily: 'inherit',
          backgroundColor: theme('colors.background.primary'),
          transition: 'border-color 0.2s ease',
          '&:focus': {
            borderColor: theme('colors.brand.accent'),
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(212, 148, 122, 0.1)',
          },
        },
        
        '.search-field': {
          padding: '12px 16px',
          borderRadius: theme('borderRadius.sm'),
          border: '1px solid',
          borderColor: theme('colors.neutral.200'),
          fontSize: theme('fontSize.body-small[0]'),
          backgroundColor: theme('colors.neutral.100'),
          width: '100%',
          maxWidth: '300px',
        },
        
        // Function Health Layout Components
        '.container-function': {
          maxWidth: theme('maxWidth.container'),
          margin: '0 auto',
          padding: `0 ${theme('spacing.container-padding')}`,
        },
        
        '.hero-container': {
          padding: '120px 24px 80px',
          maxWidth: theme('maxWidth.hero'),
          margin: '0 auto',
        },
        
        '.card-grid': {
          display: 'grid',
          gridTemplateColumns: theme('gridTemplateColumns.data-cards'),
          gap: theme('spacing.grid-gap'),
          padding: `0 ${theme('spacing.container-padding')}`,
        },
        
        '.section-padding': {
          padding: `${theme('spacing.section-padding')} 0`,
        },
        
        // Function Health Data Elements
        '.metric-display': {
          textAlign: 'center',
          marginBottom: theme('spacing.lg'),
        },
        
        '.metric-value': {
          fontSize: theme('fontSize.display-large[0]'),
          fontWeight: theme('fontSize.display-large[1].fontWeight'),
          lineHeight: theme('fontSize.display-large[1].lineHeight'),
          color: theme('colors.brand.primary'),
        },
        
        '.metric-unit': {
          fontSize: theme('fontSize.body-large[0]'),
          fontWeight: theme('fontSize.body-large[1].fontWeight'),
          color: theme('colors.neutral.500'),
          marginLeft: '4px',
        },
        
        '.metric-label': {
          fontSize: theme('fontSize.title-medium[0]'),
          fontWeight: theme('fontSize.title-medium[1].fontWeight'),
          color: theme('colors.brand.primary'),
          marginTop: theme('spacing.sm'),
        },
        
        '.chart-container': {
          height: '120px',
          margin: `${theme('spacing.lg')} 0`,
          position: 'relative',
        },
        
        '.timeline-markers': {
          fontSize: theme('fontSize.caption[0]'),
          color: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: theme('spacing.sm'),
        },
      });
    },
  ],
};