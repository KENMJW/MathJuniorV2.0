import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-ios-blue/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-ios-blue text-white shadow-sm hover:bg-ios-blue/90 active:bg-ios-blue/95',
        primary:
          'bg-text-primary text-white hover:bg-black/85 active:bg-black/90',
        secondary:
          'bg-card-subtle text-text-primary hover:bg-black/[0.06] active:bg-black/[0.08]',
        outline:
          'border border-border-subtle bg-white text-text-primary hover:bg-card-subtle hover:border-black/15',
        ghost:
          'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary',
        pill:
          'rounded-pill border border-border-subtle bg-white text-text-secondary hover:bg-card-subtle hover:text-text-primary hover:border-black/15',
        navIcon:
          'w-8 h-8 p-0 rounded-lg border border-border-subtle bg-white/80 hover:bg-white text-text-secondary hover:text-text-primary shadow-sm hover:border-black/15',
        preset:
          'rounded-pill border border-border-subtle bg-white text-text-secondary text-xs px-3 py-1 hover:bg-ios-blue hover:text-white hover:border-ios-blue active:scale-95',
        back:
          'rounded-pill border border-border-subtle bg-white text-text-primary font-medium text-xs px-3.5 py-1.5 gap-1.5 shadow-sm hover:bg-card-subtle hover:border-black/15',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-xl',
        sm: 'h-8 px-3 rounded-lg text-xs',
        lg: 'h-11 px-6 rounded-2xl text-base',
        icon: 'h-9 w-9 p-0 rounded-xl',
        pill: 'h-8 px-3.5 py-1 text-xs rounded-pill',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
