// config/cdn-config.js
const cdnConfig = {
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    
    // Performance settings
    settings: {
      always_online: 'on',
      browser_cache_ttl: 31536000, // 1 year
      browser_check: 'on',
      cache_level: 'aggressive',
      development_mode: 'off',
      edge_cache_ttl: 86400, // 1 day
      minify: {
        css: 'on',
        html: 'on',
        js: 'on'
      },
      polish: 'lossless',
      webp: 'on',
      
      // Security settings
      security_level: 'medium',
      ssl: 'flexible',
      tls_1_3: 'on',
      
      // Performance optimization
      rocket_loader: 'on',
      mirage: 'on',
      
      // Caching rules
      page_rules: [
        {
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: '*.medspasyncpro.com/static/*'
              }
            }
          ],
          actions: [
            {
              id: 'cache_level',
              value: 'cache_everything'
            },
            {
              id: 'edge_cache_ttl',
              value: 31536000 // 1 year
            }
          ]
        },
        {
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: '*.medspasyncpro.com/api/*'
              }
            }
          ],
          actions: [
            {
              id: 'cache_level',
              value: 'bypass'
            }
          ]
        }
      ]
    }
  },
  
  // Asset optimization
  assets: {
    // Static assets with long cache times
    longCache: [
      '/static/js/*.js',
      '/static/css/*.css',
      '/static/images/*.{jpg,jpeg,png,gif,webp}',
      '/static/fonts/*.{woff,woff2,ttf}'
    ],
    
    // API responses with short cache times
    shortCache: [
      '/api/analytics/*',
      '/api/reports/*'
    ],
    
    // No cache
    noCache: [
      '/api/auth/*',
      '/api/user/*',
      '/api/reconciliation/*'
    ]
  }
};

class CDNManager {
  constructor() {
    this.cloudflare = require('cloudflare')({
      token: cdnConfig.cloudflare.apiToken
    });
    
    this.setupCacheHeaders();
  }
  
  setupCacheHeaders() {
    // Express middleware for cache headers
    return (req, res, next) => {
      const url = req.url;
      
      // Long cache for static assets
      if (this.matchesPattern(url, cdnConfig.assets.longCache)) {
        res.set({
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Expires': new Date(Date.now() + 31536000000).toUTCString()
        });
      }
      
      // Short cache for API responses
      else if (this.matchesPattern(url, cdnConfig.assets.shortCache)) {
        res.set({
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'Expires': new Date(Date.now() + 300000).toUTCString()
        });
      }
      
      // No cache for sensitive endpoints
      else if (this.matchesPattern(url, cdnConfig.assets.noCache)) {
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }
      
      next();
    };
  }
  
  matchesPattern(url, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });
  }
  
  async purgeCache(urls = []) {
    try {
      await this.cloudflare.zones.purgeCache(cdnConfig.cloudflare.zoneId, {
        files: urls
      });
      
      console.log(`Purged CDN cache for ${urls.length} URLs`);
    } catch (error) {
      console.error('CDN cache purge failed:', error);
    }
  }
  
  async getCacheAnalytics() {
    try {
      const analytics = await this.cloudflare.zones.analytics.dashboard(
        cdnConfig.cloudflare.zoneId,
        {
          since: '-1440', // Last 24 hours
          until: '0'
        }
      );
      
      return {
        requests: analytics.result.totals.requests.all,
        bandwidth: analytics.result.totals.bandwidth.all,
        cacheRatio: analytics.result.totals.requests.cached / analytics.result.totals.requests.all
      };
    } catch (error) {
      console.error('Failed to get CDN analytics:', error);
      return null;
    }
  }
  
  async optimizeImages() {
    try {
      // Enable image optimization settings
      await this.cloudflare.zones.settings.polish.update(
        cdnConfig.cloudflare.zoneId,
        { value: 'lossless' }
      );
      
      // Enable WebP format
      await this.cloudflare.zones.settings.webp.update(
        cdnConfig.cloudflare.zoneId,
        { value: 'on' }
      );
      
      console.log('Image optimization enabled');
    } catch (error) {
      console.error('Failed to enable image optimization:', error);
    }
  }
  
  async enableMinification() {
    try {
      await this.cloudflare.zones.settings.minify.update(
        cdnConfig.cloudflare.zoneId,
        {
          value: {
            css: 'on',
            html: 'on',
            js: 'on'
          }
        }
      );
      
      console.log('Minification enabled');
    } catch (error) {
      console.error('Failed to enable minification:', error);
    }
  }
  
  async enableRocketLoader() {
    try {
      await this.cloudflare.zones.settings.rocket_loader.update(
        cdnConfig.cloudflare.zoneId,
        { value: 'on' }
      );
      
      console.log('Rocket Loader enabled');
    } catch (error) {
      console.error('Failed to enable Rocket Loader:', error);
    }
  }
  
  async getPerformanceMetrics() {
    try {
      const metrics = await this.cloudflare.zones.analytics.dashboard(
        cdnConfig.cloudflare.zoneId,
        {
          since: '-1440',
          until: '0'
        }
      );
      
      return {
        totalRequests: metrics.result.totals.requests.all,
        cachedRequests: metrics.result.totals.requests.cached,
        cacheHitRate: metrics.result.totals.requests.cached / metrics.result.totals.requests.all,
        bandwidth: metrics.result.totals.bandwidth.all,
        uniqueVisitors: metrics.result.totals.uniques.all
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }
}

module.exports = { CDNManager, cdnConfig }; 