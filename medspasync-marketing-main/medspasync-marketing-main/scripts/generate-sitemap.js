// scripts/generate-sitemap.js
// Generates XML sitemap for MedSpaSync Pro marketing site

const fs = require('fs');
const path = require('path');

// Base URL for MedSpaSync Pro
const baseUrl = 'https://medspasyncpro.com';

// Site structure following MedSpaSync Pro content standards
const pages = [
  // Core pages
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/features', priority: '0.9', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/support', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { path: '/terms', priority: '0.5', changefreq: 'yearly' },
  
  // Insights hub
  { path: '/insights', priority: '0.8', changefreq: 'weekly' },
  
  // Published articles
  { path: '/insights/hipaa-compliance', priority: '0.7', changefreq: 'monthly' },
  { path: '/insights/software-integration-failures', priority: '0.7', changefreq: 'monthly' },
];

// Generate current date for lastmod
const currentDate = new Date().toISOString().split('T')[0];

// Create XML sitemap content
function generateSitemap() {
  const urlElements = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

  return sitemap;
}

// Write sitemap to dist directory
function writeSitemap() {
  const distDir = path.join(__dirname, '../dist');
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Generate and write sitemap
  const sitemapContent = generateSitemap();
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  
  console.log(`✓ Sitemap generated: ${sitemapPath}`);
  console.log(`✓ ${pages.length} pages included`);
  
  return sitemapPath;
}

// Main execution
if (require.main === module) {
  try {
    writeSitemap();
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateSitemap, writeSitemap };