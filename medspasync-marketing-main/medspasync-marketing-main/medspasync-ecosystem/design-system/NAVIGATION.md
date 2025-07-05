# MedSpaSync Pro - Unified Navigation System

## 🧭 Overview

The MedSpaSync Pro Unified Navigation System provides consistent navigation across all platforms in the ecosystem. This system ensures seamless user experience from marketing to application, maintaining brand consistency and professional medical spa aesthetics.

## 🎯 Key Features

- **Role-Based Navigation**: Dynamic navigation items based on user roles
- **Platform Variants**: Specialized navigation for main app, demo, and marketing
- **Responsive Design**: Mobile-first approach with accessible mobile menu
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels
- **Authentication Integration**: Seamless auth state management
- **Consistent Styling**: Unified design tokens and visual language

## 🏗️ Architecture

### Navigation Variants

```javascript
// Main Application Navigation
<Navigation variant="main" showAuth={true} />

// Demo Application Navigation  
<Navigation variant="demo" showAuth={true} />

// Marketing Site Navigation
<Navigation variant="marketing" showAuth={true} />
```

### Role-Based Navigation Items

| Role | Dashboard | Analytics | Reconciliation | Reports | Clients | Appointments | Security | Performance |
|------|-----------|-----------|----------------|---------|---------|--------------|----------|-------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Staff | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

## 🚀 Implementation Guide

### 1. Basic Usage

```jsx
import { Navigation } from '@medspasync/design-system';

function App() {
  return (
    <Navigation
      variant="main"
      showAuth={true}
      className="custom-nav-class"
    />
  );
}
```

### 2. Platform-Specific Implementation

#### Main Application (Next.js)
```jsx
// medspasync-frontend/src/components/Navigation.tsx
import { Navigation as UnifiedNavigation } from '../../../medspasync-ecosystem/design-system/components/Navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <UnifiedNavigation
      variant="main"
      showAuth={true}
      className="bg-white shadow-lg border-b border-gray-200"
    />
  );
}
```

#### Demo Application (Next.js)
```jsx
// medspasync-pro-next/src/components/organisms/Navigation/Navigation.tsx
import { Navigation as UnifiedNavigation } from '../../../../../medspasync-ecosystem/design-system/components/Navigation';

export function Navigation({ className }) {
  return (
    <UnifiedNavigation
      variant="demo"
      showAuth={true}
      className={className}
    />
  );
}
```

#### Marketing Site (React)
```jsx
// medspasync-marketing/frontend/components/Navigation.jsx
import { Navigation as UnifiedNavigation } from '../../../medspasync-ecosystem/design-system/components/Navigation';

const Navigation = () => {
  return (
    <UnifiedNavigation
      variant="marketing"
      showAuth={true}
      className="nav-header"
    />
  );
};
```

### 3. Authentication Integration

The navigation component automatically integrates with the AuthContext:

```jsx
// Required AuthContext structure
const AuthContext = {
  user: {
    firstName: string,
    name: string,
    role: 'admin' | 'manager' | 'staff'
  },
  isAuthenticated: boolean,
  logout: () => Promise<void>
};
```

## 🎨 Styling & Customization

### Design Tokens

The navigation uses unified design tokens:

```css
/* Navigation-specific tokens */
--nav-height: 4rem;
--nav-padding-x: var(--space-4);
--nav-background: var(--bg-primary);
--nav-border-color: var(--border-primary);
```

### Custom Styling

```jsx
<Navigation
  variant="main"
  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
/>
```

### Platform-Specific Styling

#### Marketing Site
```css
.nav-header {
  background: var(--colors.background.primary);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: var(--z-index.navigation);
  border-bottom: 1px solid var(--colors.neutral.100);
}
```

#### Main Application
```css
.nav-header {
  background: white;
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-primary);
}
```

## ♿ Accessibility Features

### ARIA Labels & Roles

```jsx
<nav role="navigation" aria-label="Main navigation">
  <div role="menubar">
    <Link role="menuitem" aria-current="page">Dashboard</Link>
  </div>
  <button aria-label="User menu" aria-expanded="false" aria-haspopup="true">
    User Menu
  </button>
</nav>
```

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close mobile menu
- **Arrow Keys**: Navigate dropdown menus

### Screen Reader Support

- Proper heading hierarchy
- Descriptive link text
- Status announcements for dynamic content
- Hidden decorative elements with `aria-hidden="true"`

## 📱 Responsive Behavior

### Desktop Navigation
- Horizontal menu with role-based items
- User dropdown menu
- Authentication buttons
- Status indicators (when applicable)

### Mobile Navigation
- Hamburger menu button
- Full-screen overlay menu
- Stacked navigation items
- Touch-friendly tap targets (44px minimum)

### Breakpoint Behavior

```css
/* Desktop: md and up */
@media (min-width: 768px) {
  .mobile-menu { display: none; }
  .desktop-nav { display: flex; }
}

/* Mobile: below md */
@media (max-width: 767px) {
  .mobile-menu { display: block; }
  .desktop-nav { display: none; }
}
```

## 🔧 Configuration Options

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'main' \| 'demo' \| 'marketing'` | `'main'` | Navigation variant |
| `showAuth` | `boolean` | `true` | Show authentication elements |
| `className` | `string` | `''` | Additional CSS classes |
| `onNavigate` | `function` | `() => {}` | Navigation callback |

### Navigation Items Configuration

```javascript
const navigationItems = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home', roles: ['admin', 'manager', 'staff'] },
    { name: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['admin', 'manager'] },
    // ... more items
  ],
  demo: [
    { name: 'Home', href: '/', icon: 'Home' },
    { name: 'Features', href: '/features', icon: 'Star' },
    // ... more items
  ],
  marketing: [
    { name: 'Home', href: '/', icon: 'Home' },
    { name: 'Features', href: '/features', icon: 'Star' },
    // ... more items
  ]
};
```

## 🧪 Testing Guidelines

### Unit Tests

```javascript
import { render, screen } from '@testing-library/react';
import { Navigation } from '@medspasync/design-system';

describe('Navigation', () => {
  test('renders navigation items based on variant', () => {
    render(<Navigation variant="main" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('filters navigation items based on user role', () => {
    const mockUser = { role: 'staff' };
    render(<Navigation variant="main" user={mockUser} />);
    expect(screen.queryByText('Security')).not.toBeInTheDocument();
  });
});
```

### Accessibility Tests

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('navigation meets accessibility standards', async () => {
  const { container } = render(<Navigation />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Integration Tests

```javascript
test('navigation integrates with authentication', () => {
  const mockLogout = jest.fn();
  render(<Navigation logout={mockLogout} />);
  
  fireEvent.click(screen.getByText('Sign Out'));
  expect(mockLogout).toHaveBeenCalled();
});
```

## 🔄 Migration Guide

### From Legacy Navigation

1. **Replace Navigation Component**
   ```jsx
   // Before
   import CustomNavigation from './CustomNavigation';
   
   // After
   import { Navigation } from '@medspasync/design-system';
   ```

2. **Update Props**
   ```jsx
   // Before
   <CustomNavigation 
     links={navigationLinks}
     user={user}
     onLogout={handleLogout}
   />
   
   // After
   <Navigation
     variant="main"
     showAuth={true}
   />
   ```

3. **Remove Custom Styling**
   ```css
   /* Remove custom navigation styles */
   .custom-nav { /* Remove */ }
   .nav-links { /* Remove */ }
   ```

### Breaking Changes

- Navigation items are now configured internally
- Authentication is handled through AuthContext
- Styling uses design system tokens
- Mobile menu behavior is standardized

## 📊 Performance Considerations

### Bundle Size
- Navigation component: ~15KB gzipped
- Icons: ~2KB (emoji-based)
- Dependencies: React Router, AuthContext

### Optimization Tips

1. **Lazy Loading**
   ```jsx
   const Navigation = lazy(() => import('@medspasync/design-system/Navigation'));
   ```

2. **Memoization**
   ```jsx
   const Navigation = memo(({ variant, showAuth }) => {
     return <UnifiedNavigation variant={variant} showAuth={showAuth} />;
   });
   ```

3. **Conditional Rendering**
   ```jsx
   {isAuthenticated && <Navigation variant="main" />}
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Navigation Items Not Showing**
   - Check user role configuration
   - Verify AuthContext is properly set up
   - Ensure navigation variant is correct

2. **Styling Inconsistencies**
   - Import design system tokens
   - Check CSS specificity conflicts
   - Verify Tailwind CSS configuration

3. **Mobile Menu Not Working**
   - Check for JavaScript errors
   - Verify event handlers are properly bound
   - Test touch events on mobile devices

### Debug Mode

```jsx
<Navigation
  variant="main"
  showAuth={true}
  debug={true} // Enable debug logging
/>
```

## 📚 Additional Resources

- [Design System Documentation](./README.md)
- [Design Tokens Reference](./tokens.css)
- [Component Library](./components/)
- [Accessibility Guidelines](./ACCESSIBILITY.md)

---

**MedSpaSync Pro Navigation System** - Unified navigation for seamless medical spa management experience. 