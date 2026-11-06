import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}
export default function Select({
  label,
  id,
  name,
  children,
  className,
  ...props
}: Props) {
  return (
    <div className={cn('field', className)}>
      <label htmlFor={id || name}>{label}</label>
      <select {...props} id={id || name} name={name} className="control">
        {children}
      </select>
    </div>
  );
}
