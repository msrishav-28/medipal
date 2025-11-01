import React from 'react';
import { cn } from '@/utils/cn';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  'aria-label': string; // Required for accessibility
}

const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-600 focus:ring-primary-500',
    danger: 'bg-error-500 hover:bg-error-600 text-white focus:ring-error-500',
  };

  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;