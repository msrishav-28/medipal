import React from 'react';
import { cn } from '@/utils/cn';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  direction?: 'vertical' | 'horizontal';
  wrap?: boolean;
}

const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  direction = 'vertical',
  wrap = false,
  className,
  ...props
}) => {
  const spacingClasses = {
    xs: direction === 'vertical' ? 'space-y-1' : 'space-x-1',
    sm: direction === 'vertical' ? 'space-y-2' : 'space-x-2',
    md: direction === 'vertical' ? 'space-y-4' : 'space-x-4',
    lg: direction === 'vertical' ? 'space-y-6' : 'space-x-6',
    xl: direction === 'vertical' ? 'space-y-8' : 'space-x-8',
    '2xl': direction === 'vertical' ? 'space-y-12' : 'space-x-12',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Stack;