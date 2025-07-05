# MEDSPASYNC PRO DESIGN SYSTEM MODULE
# Function Health Visual Design System 2.0 Compliance

## DESIGN SYSTEM COMPLIANCE

### Function Health Visual Design System 2.0
- **ALWAYS** use Function Health Visual Design System 2.0 patterns
- Follow 8px base unit system: xs(4px), sm(8px), md(16px), lg(24px), xl(32px)
- Use semantic color palette: brand-primary(#000000), brand-secondary(#FFFFFF), brand-accent(#D4947A)
- Implement typography scale: hero(4rem), display-large(3rem), title-large(1.5rem)
- Apply consistent spacing: card-padding(32px), section-padding(80px), grid-gap(24px)
- Use established shadows: card(0 4px 12px rgba(0,0,0,0.05)), card-hover(0 12px 32px rgba(0,0,0,0.1))

### Component Styling Patterns
```css
/* Always use these established patterns */
.card { 
  padding: var(--spacing-card-padding);
  border-radius: var(--border-radius-card);
  box-shadow: var(--shadow-card);
}

.btn-primary {
  background: var(--color-brand-primary);
  border-radius: var(--border-radius-button);
  box-shadow: var(--shadow-button);
}

.text-hero {
  font-size: var(--font-size-hero);
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-light);
}
```

## TYPOGRAPHY SYSTEM

### Font Scale
- **Hero**: 4rem (64px) - Main headlines
- **Display Large**: 3rem (48px) - Section headers
- **Title Large**: 1.5rem (24px) - Component titles
- **Title Medium**: 1.25rem (20px) - Subsection headers
- **Body Large**: 1.125rem (18px) - Important body text
- **Body**: 1rem (16px) - Standard body text
- **Body Small**: 0.875rem (14px) - Secondary text
- **Caption**: 0.75rem (12px) - Labels and metadata

### Font Weights
- **Light**: 300 - Hero text and large displays
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasis and buttons
- **Semibold**: 600 - Headers and important text
- **Bold**: 700 - Strong emphasis

## SPACING SYSTEM

### Base Unit: 8px
- **xs**: 4px (0.5rem)
- **sm**: 8px (1rem)
- **md**: 16px (2rem)
- **lg**: 24px (3rem)
- **xl**: 32px (4rem)
- **2xl**: 48px (6rem)
- **3xl**: 64px (8rem)

### Component Spacing
- **Card Padding**: 32px
- **Section Padding**: 80px
- **Grid Gap**: 24px
- **Button Padding**: 12px 24px
- **Form Field Spacing**: 16px

## COLOR SYSTEM

### Primary Colors
- **Brand Primary**: #000000 (Black)
- **Brand Secondary**: #FFFFFF (White)
- **Brand Accent**: #D4947A (Warm Brown)

### Semantic Colors
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)
- **Info**: #3B82F6 (Blue)

### Neutral Colors
- **Gray 50**: #F9FAFB
- **Gray 100**: #F3F4F6
- **Gray 200**: #E5E7EB
- **Gray 300**: #D1D5DB
- **Gray 400**: #9CA3AF
- **Gray 500**: #6B7280
- **Gray 600**: #4B5563
- **Gray 700**: #374151
- **Gray 800**: #1F2937
- **Gray 900**: #111827

## SHADOW SYSTEM

### Elevation Levels
- **Card**: 0 4px 12px rgba(0,0,0,0.05)
- **Card Hover**: 0 12px 32px rgba(0,0,0,0.1)
- **Button**: 0 2px 4px rgba(0,0,0,0.1)
- **Button Hover**: 0 4px 8px rgba(0,0,0,0.15)
- **Modal**: 0 20px 40px rgba(0,0,0,0.15)
- **Dropdown**: 0 8px 16px rgba(0,0,0,0.1)

## BORDER RADIUS SYSTEM

### Radius Values
- **None**: 0px
- **Small**: 4px
- **Medium**: 8px
- **Large**: 12px
- **Extra Large**: 16px
- **Full**: 9999px

### Component Usage
- **Cards**: 12px
- **Buttons**: 8px
- **Form Fields**: 8px
- **Modals**: 16px
- **Images**: 8px

## RESPONSIVE DESIGN

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: 1440px+

### Mobile-First Approach
- Start with mobile styles
- Use min-width media queries
- Progressive enhancement for larger screens
- Touch-friendly interaction targets (44px minimum)

## ACCESSIBILITY COMPLIANCE

### Color Contrast
- **Normal Text**: 4.5:1 minimum ratio
- **Large Text**: 3:1 minimum ratio
- **UI Components**: 3:1 minimum ratio

### Focus States
- Visible focus indicators on all interactive elements
- High contrast focus rings
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and roles
- Alt text for images
- Descriptive link text

## COMPONENT PATTERNS

### Button Patterns
```css
.btn-primary {
  background: var(--color-brand-primary);
  color: var(--color-brand-secondary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: var(--shadow-button);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: var(--shadow-button-hover);
  transform: translateY(-1px);
}
```

### Card Patterns
```css
.card {
  background: var(--color-brand-secondary);
  padding: var(--spacing-card-padding);
  border-radius: var(--border-radius-card);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
}
```

### Form Patterns
```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-brand-accent);
  box-shadow: 0 0 0 3px rgba(212, 148, 122, 0.1);
}
```

## ANIMATION SYSTEM

### Duration Scale
- **Fast**: 150ms
- **Normal**: 300ms
- **Slow**: 500ms

### Easing Functions
- **Ease**: cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Ease In**: cubic-bezier(0.55, 0.055, 0.675, 0.19)
- **Ease Out**: cubic-bezier(0.215, 0.61, 0.355, 1)
- **Ease In Out**: cubic-bezier(0.645, 0.045, 0.355, 1)

### Common Animations
- **Fade In**: opacity 0 → 1
- **Slide Up**: transform translateY(20px) → translateY(0)
- **Scale**: transform scale(0.95) → scale(1)
- **Hover Lift**: transform translateY(0) → translateY(-2px)

## ICON SYSTEM

### Icon Sizes
- **Small**: 16px
- **Medium**: 20px
- **Large**: 24px
- **Extra Large**: 32px

### Icon Guidelines
- Use consistent stroke width (2px)
- Maintain visual weight across sizes
- Provide adequate touch targets
- Include fallback text for accessibility

## LAYOUT PATTERNS

### Grid System
- 12-column grid for desktop
- 8-column grid for tablet
- 4-column grid for mobile
- Consistent gutters (24px)

### Container Patterns
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-narrow {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-wide {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### Section Patterns
```css
.section {
  padding: var(--spacing-section-padding) 0;
}

.section-compact {
  padding: 48px 0;
}

.section-spacious {
  padding: 120px 0;
}
```

This design system module ensures consistent visual design across all MedSpaSync Pro components while maintaining accessibility and performance standards. 