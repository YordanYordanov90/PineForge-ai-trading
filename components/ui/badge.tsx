import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
  {
    variants: {
      variant: {
        default:
          'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-500',
        active:
          'border-neon-500/40 bg-neon-500/10 text-neon-700 dark:text-neon-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  dotClassName,
  children,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    dotClassName?: string;
  }) {
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        dotClassName && 'gap-1.5',
        className,
      )}
      {...props}
    >
      {dotClassName ? (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClassName)}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };