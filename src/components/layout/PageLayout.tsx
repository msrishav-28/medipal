import React from 'react';
import { cn } from '@/utils/cn';
import { useBreakpoint } from './BreakpointProvider';
import BottomNavigation from './BottomNavigation';
import SidebarNavigation from './SidebarNavigation';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children?: NavigationItem[];
}

interface PageLayoutProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  activeNavItem?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'compact' | 'comfortable' | 'spacious';
  showNavigation?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  navigationItems,
  activeNavItem,
  maxWidth = 'xl',
  padding = 'comfortable',
  showNavigation = true,
  sidebarCollapsed = false,
  onToggleSidebar,
  className,
}) => {
  const { isMobile } = useBreakpoint();

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };

  const paddingClasses = {
    compact: 'p-4',
    comfortable: 'p-6',
    spacious: 'p-8',
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar Navigation (Tablet/Desktop) */}
      {showNavigation && !isMobile && (
        <SidebarNavigation
          items={navigationItems}
          {...(activeNavItem ? { activeItem: activeNavItem } : {})}
          collapsed={sidebarCollapsed}
          {...(onToggleSidebar ? { onToggleCollapse: onToggleSidebar } : {})}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <main
          className={cn(
            'flex-1 w-full mx-auto',
            maxWidthClasses[maxWidth],
            paddingClasses[padding],
            isMobile && showNavigation && 'pb-20', // Add bottom padding for mobile nav
            className
          )}
          role="main"
        >
          {children}
        </main>

        {/* Bottom Navigation (Mobile) */}
        {showNavigation && isMobile && (
          <BottomNavigation
            items={navigationItems}
            {...(activeNavItem ? { activeItem: activeNavItem } : {})}
          />
        )}
      </div>
    </div>
  );
};

export default PageLayout;