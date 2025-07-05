// meta.js - MedSpaSync Pro SEO and Social Media Meta Tags
// Enhanced with proven content standards and royal we positioning

// Default metadata aligned with proven content template
export const defaultMeta = {
  title: 'Stop Losing 8+ Hours Weekly to Manual Reconciliation | MedSpaSync Pro',
  description: 'AI matching achieves 95%+ accuracy, preventing $2,500+ monthly in missed revenue. The AI Intelligence Layer for Medical Spas - start reconciling within 24 hours.',
  image: 'https://medspasyncpro.com/og-image.jpg',
  url: 'https://medspasyncpro.com',
  siteName: 'MedSpaSync Pro',
  author: 'MedSpaSync Pro Team',
  keywords: 'medical spa reconciliation, AI automation, Alle Aspire reconciliation, spa software, HIPAA compliant',
  themeColor: '#059669', // Emerald brand color
};

// Page-specific meta templates following proven content standards
export const pageMetaTemplates = {
  home: {
    title: 'Stop Losing 8+ Hours Weekly to Manual Reconciliation | MedSpaSync Pro',
    description: 'AI matching achieves 95%+ accuracy, preventing $2,500+ monthly in missed revenue. The AI Intelligence Layer for Medical Spas built by operations experts.',
    keywords: 'medical spa reconciliation, manual reconciliation cost, AI automation, Alle Aspire matching',
  },
  
  features: {
    title: 'AI Features That Eliminate Manual Reconciliation | MedSpaSync Pro',
    description: 'Machine learning achieves 95%+ accuracy across Alle, Aspire, and POS systems. Save 8+ hours weekly with intelligent automation designed by spa operations experts.',
    keywords: 'AI reconciliation features, medical spa automation, Alle Aspire AI, POS reconciliation',
  },
  
  pricing: {
    title: 'Honest Pricing for Medical Spa Reconciliation | MedSpaSync Pro',
    description: 'Core at $299/month saves 8+ hours weekly and prevents $2,500+ monthly revenue loss. 12x ROI with 24-hour implementation. No sales calls required.',
    keywords: 'medical spa software pricing, reconciliation cost, spa automation ROI',
  },
  
  about: {
    title: 'The AI Intelligence Layer for Medical Spas | About MedSpaSync Pro',
    description: 'Built by medical spa operations experts who understand the 8+ hours weekly and $2,500+ monthly cost of manual reconciliation. Science-driven. Operator-informed.',
    keywords: 'medical spa operations experts, reconciliation specialists, spa software team',
  },
  
  insights: {
    title: 'Medical Spa Reconciliation Insights | MedSpaSync Pro',
    description: 'Research-backed insights on medical spa reconciliation challenges. Stop losing 8+ hours weekly and $2,500+ monthly to manual processes.',
    keywords: 'medical spa insights, reconciliation research, spa operations analysis',
  },
  
  contact: {
    title: 'Stop Losing Revenue to Reconciliation Problems | Contact MedSpaSync Pro',
    description: 'Questions about eliminating 8+ hours weekly of manual reconciliation? Our operations experts respond within 24 hours with actionable solutions.',
    keywords: 'medical spa support, reconciliation help, spa automation consultation',
  },
  
  demo: {
    title: 'Try AI Reconciliation Demo | MedSpaSync Pro',
    description: 'See 95%+ AI accuracy in action. Upload your CSV files and watch intelligent matching eliminate manual reconciliation. No email required.',
    keywords: 'medical spa demo, AI reconciliation demo, Alle Aspire demo, free trial',
  },
  
  support: {
    title: 'Operations-Expert Support | MedSpaSync Pro',
    description: 'Support from medical spa operations experts who understand reconciliation challenges. 24-hour response times, no outsourced chat bots.',
    keywords: 'medical spa support, reconciliation help, expert consultation',
  },
  
  privacy: {
    title: 'HIPAA-Conscious Privacy Policy | MedSpaSync Pro',
    description: 'Security-first reconciliation with HIPAA-conscious design. Zero permanent storage, encrypted processing, and automatic file deletion.',
    keywords: 'HIPAA compliant software, medical spa privacy, secure reconciliation',
  },
  
  // Article templates
  'insights/hipaa-compliance': {
    title: 'HIPAA-Conscious Automation Prevents $2,500+ Monthly Compliance Risks | MedSpaSync Pro',
    description: 'Medical spas waste 8+ hours weekly on manual processes while risking HIPAA violations. Our compliance analysis reveals how intelligent automation maintains security.',
    keywords: 'HIPAA compliance medical spa, automated compliance, spa security requirements',
  },
  
  'insights/software-integration-failures': {
    title: 'Why All-in-One Platforms Fail at Reconciliation: The $2,500+ Monthly Cost | MedSpaSync Pro',
    description: 'Software integration failures cost medical spas 8+ hours weekly and $2,500+ monthly in missed revenue. Our analysis of why specialist beats generalist.',
    keywords: 'medical spa software integration, reconciliation failures, spa platform problems',
  },
};

/**
 * Enhanced meta injection with medical spa platform optimizations
 * @param {Object} meta - Overrides for default meta
 * @param {string} pagePath - Current page path for template lookup
 */
export function injectMeta(meta = {}, pagePath = '') {
  // Get page-specific template if available
  const pageTemplate = pageMetaTemplates[pagePath] || {};
  
  // Merge in order: defaults -> page template -> custom overrides
  const fullMeta = { 
    ...defaultMeta, 
    ...pageTemplate, 
    ...meta 
  };

  // Update document title
  document.title = fullMeta.title;

  // Enhanced meta tags for medical spa platform
  const tags = [
    // Basic SEO
    { name: 'description', content: fullMeta.description },
    { name: 'keywords', content: fullMeta.keywords },
    { name: 'author', content: fullMeta.author },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph (Facebook, LinkedIn)
    { property: 'og:title', content: fullMeta.title },
    { property: 'og:description', content: fullMeta.description },
    { property: 'og:image', content: fullMeta.image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: fullMeta.url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: fullMeta.siteName },
    { property: 'og:locale', content: 'en_US' },
    
    // Twitter Cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullMeta.title },
    { name: 'twitter:description', content: fullMeta.description },
    { name: 'twitter:image', content: fullMeta.image },
    { name: 'twitter:image:alt', content: 'MedSpaSync Pro - AI Intelligence Layer for Medical Spas' },
    
    // Medical spa platform specific
    { name: 'application-name', content: 'MedSpaSync Pro' },
    { name: 'theme-color', content: fullMeta.themeColor },
    { name: 'msapplication-TileColor', content: fullMeta.themeColor },
    
    // Mobile optimization
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' },
    
    // Security
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
    { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
    
    // Performance hints
    { name: 'preconnect', content: 'https://fonts.googleapis.com' },
    { name: 'dns-prefetch', content: 'https://app.medspasyncpro.com' },
    { name: 'dns-prefetch', content: 'https://api.medspasyncpro.com' },
  ];

  // Inject or update meta tags
  tags.forEach(({ name, property, content, 'http-equiv': httpEquiv }) => {
    let selector;
    if (name) selector = `meta[name="${name}"]`;
    else if (property) selector = `meta[property="${property}"]`;
    else if (httpEquiv) selector = `meta[http-equiv="${httpEquiv}"]`;
    
    let tag = document.head.querySelector(selector);

    if (!tag) {
      tag = document.createElement('meta');
      if (name) tag.setAttribute('name', name);
      if (property) tag.setAttribute('property', property);
      if (httpEquiv) tag.setAttribute('http-equiv', httpEquiv);
      document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
  });

  // Add structured data for medical spa platform
  injectStructuredData(fullMeta, pagePath);
}

/**
 * Inject JSON-LD structured data for better SEO
 * @param {Object} meta - Full meta object
 * @param {string} pagePath - Current page path
 */
function injectStructuredData(meta, pagePath) {
  // Remove existing structured data
  const existingData = document.head.querySelector('script[type="application/ld+json"]');
  if (existingData) {
    existingData.remove();
  }

  let structuredData;

  if (pagePath === 'home' || pagePath === '') {
    // Organization + SoftwareApplication schema for homepage
    structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://medspasyncpro.com/#organization",
          "name": "MedSpaSync Pro",
          "url": "https://medspasyncpro.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://medspasyncpro.com/logo.png"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-MEDSPA",
            "contactType": "customer service",
            "email": "support@medspasyncpro.com",
            "availableLanguage": "en"
          },
          "sameAs": [
            "https://linkedin.com/company/medspasyncpro",
            "https://twitter.com/medspasyncpro"
          ]
        },
        {
          "@type": "SoftwareApplication",
          "name": "MedSpaSync Pro",
          "description": meta.description,
          "url": "https://medspasyncpro.com",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "299",
            "priceCurrency": "USD",
            "billingIncrement": "Month",
            "description": "Core Plan - AI reconciliation for medical spas"
          },
          "featureList": [
            "95%+ AI matching accuracy",
            "24-hour implementation", 
            "HIPAA-conscious design",
            "Alle and Aspire integration",
            "Automated PDF reports"
          ],
          "publisher": {
            "@id": "https://medspasyncpro.com/#organization"
          }
        }
      ]
    };
  } else if (pagePath.startsWith('insights/')) {
    // Article schema for insights pages
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": meta.title,
      "description": meta.description,
      "image": meta.image,
      "author": {
        "@type": "Organization",
        "name": "MedSpaSync Pro Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "MedSpaSync Pro",
        "logo": {
          "@type": "ImageObject",
          "url": "https://medspasyncpro.com/logo.png"
        }
      },
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": meta.url
      }
    };
  } else {
    // Basic WebPage schema for other pages
    structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": meta.title,
      "description": meta.description,
      "url": meta.url,
      "isPartOf": {
        "@type": "WebSite",
        "name": "MedSpaSync Pro",
        "url": "https://medspasyncpro.com"
      },
      "about": {
        "@type": "SoftwareApplication",
        "name": "MedSpaSync Pro",
        "description": "AI Intelligence Layer for Medical Spas"
      }
    };
  }

  // Inject structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

/**
 * Generate page-specific meta for React Helmet
 * @param {string} pagePath - Current page path
 * @param {Object} customMeta - Custom meta overrides
 * @returns {Object} Meta object for React Helmet
 */
export function getPageMeta(pagePath, customMeta = {}) {
  const pageTemplate = pageMetaTemplates[pagePath] || {};
  return { 
    ...defaultMeta, 
    ...pageTemplate, 
    ...customMeta 
  };
}

/**
 * Medical spa specific meta helpers
 */
export const metaHelpers = {
  // Generate meta for article pages
  article: (title, description, publishDate) => ({
    title: `${title} | MedSpaSync Pro Insights`,
    description,
    'article:published_time': publishDate,
    'article:author': 'MedSpaSync Pro Team',
    'article:section': 'Medical Spa Operations',
  }),
  
  // Generate meta for feature pages
  feature: (featureName, description) => ({
    title: `${featureName} | MedSpaSync Pro Features`,
    description: `${description} Save 8+ hours weekly with AI-powered medical spa reconciliation.`,
    keywords: `${featureName.toLowerCase()}, medical spa automation, AI reconciliation`,
  }),
  
  // Generate meta for demo pages
  demo: (demoType) => ({
    title: `Try ${demoType} Demo | MedSpaSync Pro`,
    description: `See ${demoType} in action with 95%+ AI accuracy. Upload your files and watch intelligent reconciliation eliminate manual work.`,
    keywords: `${demoType.toLowerCase()} demo, medical spa demo, AI reconciliation trial`,
  }),
};