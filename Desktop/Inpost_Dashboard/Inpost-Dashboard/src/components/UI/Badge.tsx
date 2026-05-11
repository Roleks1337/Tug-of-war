import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  yellow: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gray: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
