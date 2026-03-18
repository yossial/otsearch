/**
 * Button — design-system button with typed variants.
 *
 * Variants:
 *   primary    — navy bg, white text  (default)
 *   secondary  — outline, navy hover
 *   accent     — yellow bg, dark text
 *   ghost      — transparent, subtle hover
 *   destructive — transparent, red hover
 *
 * Sizes: sm | md (default) | lg
 *
 * All standard <button> HTML attributes are forwarded.
 * For link-buttons use next/link with className instead.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variantClasses = {
  primary: [
    'bg-primary text-white font-normal tracking-wide',
    'hover:-translate-y-0.5 hover:bg-primary-dark',
    'hover:shadow-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
    'disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  secondary: [
    'border border-border bg-transparent text-text-secondary font-normal',
    'hover:-translate-y-0.5 hover:border-border hover:shadow-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none',
  ].join(' '),

  accent: [
    'bg-accent text-text-accent font-normal tracking-wide',
    'hover:-translate-y-0.5 hover:bg-accent-dark',
    'hover:shadow-accent',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
    'disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary font-normal',
    'hover:bg-primary-xlight hover:text-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  destructive: [
    'bg-transparent text-text-secondary font-normal',
    'hover:bg-red-50 hover:text-red-600',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
} as const;

const sizeClasses = {
  sm:  'px-3 py-1.5 text-xs rounded-md',
  md:  'px-4 py-2 text-sm rounded-lg',
  lg:  'px-6 py-2.5 text-sm rounded-lg',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';

export { Button };
