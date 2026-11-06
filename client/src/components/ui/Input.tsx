import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}
export default function Input({
  label,
  hint,
  id,
  name,
  className,
  ...props
}: Props) {
  const inputId = id || name;
  return (
    <div className={cn('field', className)}>
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        name={name}
        className="control"
        aria-describedby={hint ? `${inputId}-hint` : undefined}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
