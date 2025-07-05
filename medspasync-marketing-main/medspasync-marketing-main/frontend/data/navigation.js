// Shared navigation data for consistent navigation across components
export const navigationItems = [
  {
    label: 'Features',
    href: '#features',
    external: false
  },
  {
    label: 'Pricing', 
    href: '#pricing',
    external: false
  },
  {
    label: 'Insights',
    href: '/insights',
    external: false
  },
  {
    label: 'About',
    href: '#about',
    external: false
  }
];

export const ctaButtons = {
  demo: {
    label: 'Try Demo',
    url: 'https://demo.medspasyncpro.com',
    external: true,
    variant: 'secondary'
  },
  subscribe: {
    label: 'Subscribe Now',
    variant: 'primary'
  }
};

export const logoConfig = {
  text: 'MedSpaSync Pro',
  icon: {
    viewBox: '0 0 24 24',
    path: 'M13 10V3L4 14h7v7l9-11h-7z'
  }
};