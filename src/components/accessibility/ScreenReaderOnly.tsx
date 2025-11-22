import React from 'react';
import { cn } from '@/utils/cn';

interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  as: Component = 'span',
  className,
  ...props
}) => {
  return (
    <Component
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default ScreenReaderOnly;