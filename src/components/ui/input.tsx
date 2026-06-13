import * as React from 'react';
import { ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outline';
}

export const Input: ForwardRefExoticComponent<
  InputProps & RefAttributes<HTMLInputElement>
> = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  // Sleek, modern input with smooth transitions and subtle depth supporting Dark Mode
  const baseClasses = 'flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.03)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    default: '',
    outline: 'border-2 border-input hover:border-primary/50 bg-background shadow-sm',
  };

  return (
    <input
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';