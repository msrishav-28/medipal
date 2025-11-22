import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  hover = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('card', hover && 'card-hover cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
