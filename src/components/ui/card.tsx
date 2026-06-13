import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export const Card = ({ className = '', children }: CardProps) => {
  // Premium glassmorphic / modern card design
  const baseClasses = 'rounded-2xl bg-white/95 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300';

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';