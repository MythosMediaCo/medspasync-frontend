import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    // Enhanced Plugin Configuration
    plugins: [
      react({
        // React Fast Refresh for better development experience
        fastRefresh: true,
        // Include .jsx files in Fast Refresh
        include: /\.(jsx|tsx)$/,
      }),
      
      // Add PWA plugin for professional medical spa platform
      // Uncomment when ready to implement PWA features
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      //     runtimeCaching: [
      //       {
      //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'google-fonts-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      //           }
      //         }
      //       }
      //     ]
      //   }
      // }),
    ],

    // Path Resolution for Clean Imports
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@context': resolve(__dirname, 'src/context'),
        '@hooks': resolve(__dirname, 'src/hooks'),
      },
    },

    // Enhanced Build Configuration
    build: {
      // Source maps for production debugging (medical spa compliance)
      sourcemap: isProduction ? 'hidden' : true,
      
      // Output directory for static hosting (Netlify/Vercel)
      outDir: 'dist',
      emptyOutDir: true,
      
      // Advanced build optimizations
      target: 'es2015', // Support modern browsers (medical spa professionals)
      minify: isProduction ? 'terser' : false,
      
      // Terser options for better compression
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,     // Remove console.logs in production
          drop_debugger: true,    // Remove debugger statements
          pure_funcs: ['console.log', 'console.info'], // Remove specific functions
        },
        mangle: {
          safari10: true,         // Safari compatibility
        },
        format: {
          comments: false,        // Remove comments for smaller bundles
        },
      } : {},
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal loading
          manualChunks: {
            // Vendor libraries
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['react-helmet-async'],
            
            // MedSpaSync Pro specific chunks
            'medical-spa-core': [
              // Add your medical spa specific modules here
              // './src/utils/reconciliation.js',
              // './src/utils/analytics.js',
            ],
          },
          
          // File naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop().replace('.js', '') 
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            let extType = info[info.length - 1];
            
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              extType = 'media';
            } else if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
              extType = 'images';
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              extType = 'fonts';
            }
            
            return `${extType}/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (if using CDN)
        external: isProduction ? [
          // Uncomment if using CDN for production
          // 'react',
          // 'react-dom',
        ] : [],
      },
      
      // Bundle size analysis
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    },

    // Enhanced Development Server
    server: {
      port: 3000,
      open: true,
      host: true, // Allow network access for team testing
      
      // CORS for medical spa API integration
      cors: true,
      
      // Proxy configuration for API calls
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
      
      // Security headers for development
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    },

    // Preview server configuration (for production testing)
    preview: {
      port: 4173,
      host: true,
      cors: true,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },

    // Environment Variables
    define: {
      // Global constants
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction,
      
      // Medical spa platform specific
      __PLATFORM_NAME__: JSON.stringify('MedSpaSync Pro'),
      __DEMO_MODE__: JSON.stringify(env.VITE_DEMO_MODE === 'true'),
    },

    // CSS Configuration
    css: {
      // PostCSS configuration
      postcss: {
        plugins: [
          // Will use postcss.config.js
        ],
      },
      
      // CSS modules for component-specific styles
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isDevelopment 
          ? '[name]__[local]___[hash:base64:5]'
          : '[hash:base64:8]',
      },
      
      // CSS preprocessing
      preprocessorOptions: {
        scss: {
          additionalData: `
            // Global SCSS variables for MedSpaSync Pro
            $primary-color: #059669;
            $secondary-color: #4f46e5;
            $cost-color: #dc2626;
            $success-color: #10b981;
          `,
        },
      },
    },

    // Optimization Configuration
    optimizeDeps: {
      // Include dependencies that should be pre-bundled
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-helmet-async',
      ],
      
      // Exclude dependencies from pre-bundling
      exclude: [
        // Large dependencies that don't benefit from pre-bundling
      ],
      
      // Force optimization of specific dependencies
      force: true,
    },

    // Worker Configuration (for potential AI processing)
    worker: {
      format: 'es',
      plugins: [
        // Worker-specific plugins if needed
      ],
    },

    // JSON Configuration
    json: {
      namedExports: true,
      stringify: false,
    },

    // Environment-specific configuration
    ...(isDevelopment && {
      // Development-only configuration
      esbuild: {
        define: {
          // Development debugging
          __DEV__: 'true',
        },
      },
    }),

    ...(isProduction && {
      // Production-only configuration
      esbuild: {
        drop: ['console', 'debugger'], // Remove console statements
        legalComments: 'none',         // Remove legal comments
      },
    }),
  };
});