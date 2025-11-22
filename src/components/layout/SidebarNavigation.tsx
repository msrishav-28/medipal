import React from 'react';
import { cn } from '@/utils/cn';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children?: NavigationItem[];
}

interface SidebarNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  items,
  activeItem,
  collapsed = false,
  onToggleCollapse,
  className,
}) => {
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;
    
    const handleClick = () => {
      if (item.onClick) {
        item.onClick();
      }
    };

    const content = (
      <div
        className={cn(
          'flex items-center space-x-3 py-3 px-4 rounded-lg transition-all duration-200 group',
          level > 0 && 'ml-6',
          isActive
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-neutral-700 hover:bg-neutral-100'
        )}
      >
        <div className="relative flex-shrink-0">
          <div className="w-5 h-5 flex items-center justify-center">
            {item.icon}
          </div>
          {item.badge && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <>
            <span className="flex-1 font-medium truncate">{item.label}</span>
            {hasChildren && (
              <div className="w-4 h-4 flex items-center justify-center">
                <svg
                  className="w-3 h-3 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    );

    if (item.href) {
      return (
        <div key={item.id}>
          <a
            href={item.href}
            className="block focus-ring"
            aria-current={isActive ? 'page' : undefined}
          >
            {content}
          </a>
          {hasChildren && !collapsed && (
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id}>
        <button
          onClick={handleClick}
          className="w-full text-left focus-ring"
          aria-current={isActive ? 'page' : undefined}
        >
          {content}
        </button>
        {hasChildren && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-white border-r border-neutral-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-neutral-800">MediCare</h2>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-neutral-100 focus-ring"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                collapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map((item) => renderNavigationItem(item))}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 text-center">
            Version 1.0.0
          </div>
        </div>
      )}
    </nav>
  );
};

export default SidebarNavigation;