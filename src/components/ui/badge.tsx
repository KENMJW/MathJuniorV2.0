import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ios-blue text-white',
        secondary: 'border-transparent bg-card-subtle text-text-secondary',
        outline: 'border border-border-subtle text-text-primary bg-white',
        core: 'border-transparent bg-[#ff3b30] text-white font-bold',
        ready: 'border-transparent bg-[rgba(52,199,89,0.12)] text-[#248a3d]',
        pending: 'border-transparent bg-black/[0.04] text-text-tertiary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
