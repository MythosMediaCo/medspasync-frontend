// postcss.config.cjs - MedSpaSync Pro Marketing Site
// Enhanced PostCSS configuration for professional medical spa platform

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  plugins: [
    // Import resolution for CSS files
    require('postcss-import')({
      path: ['src', 'src/styles', 'node_modules']
    }),
    
    // Tailwind CSS - Core utility framework
    require('tailwindcss')({
      // Explicit config path for reliability
      config: './tailwind.config.js'
    }),
    
    // Nested CSS support for better organization
    require('postcss-nested'),
    
    // Custom properties (CSS variables) support
    require('postcss-custom-properties')({
      preserve: false, // Don't preserve original custom properties in output
      importFrom: 'src/styles/variables.css' // Import CSS variables if file exists
    }),
    
    // CSS Grid and Flexbox gap property support for older browsers
    require('postcss-gap-properties'),
    
    // Logical properties support (margin-inline-start, etc.)
    require('postcss-logical')({
      preserve: true // Keep both logical and physical properties
    }),
    
    // Focus-visible polyfill for better accessibility
    require('postcss-focus-visible'),
    
    // Production-only optimizations
    ...(isProduction ? [
      // Remove unused CSS classes and optimize
      require('@fullhuman/postcss-purgecss')({
        content: [
          './index.html',
          './src/**/*.{js,jsx,ts,tsx}',
          './src/**/*.html'
        ],
        safelist: [
          // Preserve dynamic classes that might not be detected
          /^(bg|text|border)-(emerald|indigo|red|orange|blue)-(50|100|200|300|400|500|600|700|800|900)$/,
          /^(hover|focus|active|dark):/,
          /^gradient-/,
          /^button-/,
          /^card-/,
          /^alert-/,
          /^metric-/,
          // Preserve classes used in JavaScript
          'hidden',
          'block',
          'flex',
          'grid',
          'sr-only',
          // Toast and modal classes
          'toast-',
          'modal-',
          // Theme classes
          'dark',
          'light'
        ],
        defaultExtractor: content => {
          // Enhanced extractor for better class detection
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
          const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
          return broadMatches.concat(innerMatches);
        }
      }),
      
      // CSS optimization and minification
      require('cssnano')({
        preset: ['advanced', {
          // Preserve important comments
          discardComments: {
            removeAll: false,
            removeAllButFirst: true
          },
          // Optimize CSS custom properties
          reduceIdents: false,
          // Merge rules safely
          mergeRules: true,
          // Optimize animations
          normalizeString: true,
          // Optimize font weights
          minifyFontValues: true,
          // Convert colors to shorter formats
          colormin: true,
          // Remove duplicate rules
          uniqueSelectors: true,
          // Optimize calc() expressions
          calc: true,
          // Optimize z-index values
          zindex: false // Keep original z-index for predictability
        }]
      })
    ] : [
      // Development-only plugins
      ...(isDevelopment ? [
        // Better CSS debugging in development
        require('postcss-reporter')({
          clearReportedMessages: true,
          throwError: false
        })
      ] : [])
    ]),
    
    // Autoprefixer - Always last for vendor prefixes
    require('autoprefixer')({
      // Target browsers (matches package.json browserslist)
      browsers: isProduction 
        ? ['>0.2%', 'not dead', 'not op_mini all']
        : ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
      
      // Grid support for IE 11 (if needed)
      grid: 'autoplace',
      
      // Flexbox support
      flexbox: 'no-2009',
      
      // Remove outdated prefixes
      remove: true,
      
      // Add prefixes for newer properties
      cascade: false // Disable cascade for cleaner output
    })
  ],
  
  // Parser options for better error handling
  parser: require('postcss-scss'), // Enable SCSS-like syntax if needed
  
  // Source maps for development debugging
  map: isDevelopment ? { inline: true } : false
}; 