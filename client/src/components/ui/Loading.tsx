import { LoaderCircle } from 'lucide-react';
export default function Loading({
  message = 'Loading…',
}: {
  message?: string;
}) {
  return (
    <div role="status" className="loading-state">
      <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
