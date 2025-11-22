import React from 'react';
import { cn } from '@/utils/cn';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItem,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 px-4 py-2 safe-area-inset-bottom',
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          
          const handleClick = () => {
            if (item.onClick) {
              item.onClick();
            }
          };

          const content = (
            <div className="flex flex-col items-center space-y-1 py-2 px-3 min-w-0">
              <div className="relative">
                <div
                  className={cn(
                    'w-6 h-6 flex items-center justify-center transition-colors duration-200',
                    isActive ? 'text-primary-500' : 'text-neutral-500'
                  )}
                >
                  {item.icon}
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium truncate transition-colors duration-200',
                  isActive ? 'text-primary-500' : 'text-neutral-500'
                )}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'flex-1 flex justify-center touch-target focus-ring rounded-lg transition-colors duration-200',
                  isActive ? 'bg-primary-50' : 'hover:bg-neutral-50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={cn(
                'flex-1 flex justify-center touch-target focus-ring rounded-lg transition-colors duration-200',
                isActive ? 'bg-primary-50' : 'hover:bg-neutral-50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;