import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}
export default function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn('btn', `btn-${variant}`, className)}
    >
      {loading && (
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
