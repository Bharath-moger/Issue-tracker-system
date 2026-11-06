import { AlertCircle } from 'lucide-react';
import Button from './Button';
export default function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div role="alert" className="error-state">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <p>{message}</p>
        {retry && (
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
