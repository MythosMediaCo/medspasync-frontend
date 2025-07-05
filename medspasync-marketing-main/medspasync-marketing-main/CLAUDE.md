# CLAUDE.md - MedSpaSync Pro Marketing Website

## Project Overview
MedSpaSync Pro marketing website - The AI Intelligence Layer for Medical Spas. This is a React-based marketing site for a medical spa reconciliation SaaS product that helps medical spas automatically match POS transactions with loyalty rewards programs like Alle and Aspire.

## Tech Stack
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **Language**: JavaScript/JSX (TypeScript types available)
- **Testing**: Vitest with jsdom
- **Build Tool**: Vite
- **Deployment**: Netlify (configured)

## Key Scripts
```bash
# Development
npm run dev              # Start dev server with host
npm run build           # Production build
npm run preview         # Preview built site

# Quality Assurance
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix ESLint issues
npm run type-check      # TypeScript type checking
npm run format          # Format with Prettier
npm run test            # Run tests
npm run test:coverage   # Test coverage report

# Performance & SEO
npm run lighthouse      # Lighthouse audit
npm run sitemap         # Generate sitemap

# Deployment
npm run deploy:staging     # Deploy to staging
npm run deploy:production  # Deploy to production
```

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation header
│   ├── Hero.jsx        # Hero section
│   ├── Problem.jsx     # Problem statement
│   ├── Solutions.jsx   # Solution features
│   ├── Pricing.jsx     # Pricing cards
│   ├── Toast.jsx       # Toast notifications
│   └── ...
├── pages/              # Route pages
│   ├── Home.jsx        # Main landing page
│   ├── PricingPage.jsx # Dedicated pricing page
│   ├── FeaturesPage.jsx# Features overview
│   ├── Articles/       # Blog/insight articles
│   └── ...
├── context/            # React context providers
│   └── ToastContext.jsx# Toast notification system
└── utils/              # Utility functions
    ├── formSubmit.js   # Form handling
    └── meta.js         # SEO meta utilities
```

## Key Features
- **Responsive Design**: Mobile-first Tailwind CSS implementation
- **SEO Optimized**: React Helmet Async for meta tags
- **Performance**: Lighthouse auditing, bundle analysis
- **Toast System**: Custom toast notifications for user feedback
- **Form Handling**: Contact forms with validation
- **PWA Ready**: Service worker and manifest configured

## Business Context
- **Target Market**: Medical spas struggling with manual reconciliation
- **Pain Points**: 8+ hours weekly on manual matching, $2,500+ monthly losses
- **Solution**: AI-powered 95%+ accuracy matching for POS/loyalty programs
- **Pricing**: $299/month Core plan, $499/month Professional (coming Q3 2025)

## Development Notes
- Uses modern React patterns (hooks, context)
- Tailwind for consistent design system
- Component-based architecture for reusability
- TypeScript types available but project uses JSX
- Comprehensive linting and formatting setup

## Deployment
- **Platform**: Netlify
- **Domain**: medspasyncpro.com
- **Environments**: Staging and production configured
- **Build**: Automated on git push via netlify.toml

## Recent Updates & Known Issues Fixed
- **Demo Site Alignment**: Updated Home.jsx to match demo.medspasyncpro.com design patterns
- **Design System**: Implemented demo-inspired classes for consistent look and feel
- **Color Scheme**: Updated to use emerald green (#059669) as primary brand color
- **Interactive Elements**: Added demo-style pricing cards, status badges, and animations
- **Accessibility**: Added skip links and focus states for better accessibility
- **Layout**: Converted to single-page scrolling design with proper anchor links
- **Typography**: Enhanced with gradient text effects and Inter font consistency
- **Fixed**: Home.jsx corrupted/duplicate content sections removed

## Toast System Usage
```jsx
import { useToast } from '../context/ToastContext';

const { showToast } = useToast();
showToast('Message', 'success'); // success, error, info, warning
```

## Form Submission
Forms use utils/formSubmit.js for handling contact form submissions with proper validation and user feedback.

## Performance Considerations
- Lighthouse auditing integrated
- Bundle analysis available via build:analyze
- Font optimization with local Inter font files
- Image optimization recommendations in place