import React from 'react';
import { cn } from '@/utils/cn';
import { useBreakpoint } from './BreakpointProvider';

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'md',
  align = 'stretch',
  className,
  ...props
}) => {
  const { isMobile, isTablet, isDesktop, isWide } = useBreakpoint();

  const getColumns = () => {
    if (isMobile) return cols.mobile || 1;
    if (isTablet) return cols.tablet || 2;
    if (isDesktop) return cols.desktop || 3;
    if (isWide) return cols.wide || 4;
    return 1;
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const columns = getColumns();

  return (
    <div
      className={cn(
        'grid',
        gridCols[columns as keyof typeof gridCols] || 'grid-cols-1',
        gapClasses[gap],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;