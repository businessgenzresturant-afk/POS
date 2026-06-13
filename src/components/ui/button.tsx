import * as React from 'react';
import { ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
> = React.forwardRef(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  // Base classes for smooth micro-animations and structural consistency
  const baseClasses = 'relative inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none';

  // 3D & Modern Variants
  const variantClasses = {
    default: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border border-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.2)] hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(16,185,129,0.3)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[1px]',
    destructive: 'bg-gradient-to-b from-red-500 to-red-600 text-white border border-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.2)] hover:from-red-400 hover:to-red-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(220,38,38,0.3)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[1px]',
    outline: 'bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 hover:shadow-[0_2px_8px_rgba(16,185,129,0.15)] active:translate-y-[1px]',
    secondary: 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] hover:from-white hover:to-gray-100 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.1)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px]',
    ghost: 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 active:bg-gray-200',
    link: 'underline-offset-4 hover:underline text-emerald-600 hover:text-emerald-500',
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white border border-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_10px_rgba(16,185,129,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm',
  };

  const sizeClasses = {
    default: 'h-11 px-5 py-2.5',
    sm: 'h-9 px-4 rounded-lg text-xs font-bold tracking-wide',
    lg: 'h-14 px-8 rounded-2xl text-base font-bold shadow-md',
    icon: 'h-11 w-11 rounded-xl',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';