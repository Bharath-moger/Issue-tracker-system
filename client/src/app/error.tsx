'use client';
import ErrorState from '@/components/ui/ErrorState';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state">
      <ErrorState
        message="This page could not be displayed. Please try again."
        retry={reset}
      />
    </main>
  );
}
