'use client';

import { Navigation as UnifiedNavigation } from '../../../../../medspasync-ecosystem/design-system/components/Navigation';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  return (
    <UnifiedNavigation
      variant="demo"
      showAuth={true}
      className={className}
    />
  );
} 