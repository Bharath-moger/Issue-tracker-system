import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
export default function NotFound() {
  return (
    <main className="standalone-state">
      <EmptyState
        title="Page not found"
        description="The page you’re looking for doesn’t exist."
        action={
          <Link className="btn btn-primary" href="/dashboard">
            Go to dashboard
          </Link>
        }
      />
    </main>
  );
}
