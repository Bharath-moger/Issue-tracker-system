'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
export default function Home() {
  const { user, loading, error, refreshUser, logout, loginPath } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !error) router.replace(user ? '/dashboard' : loginPath);
  }, [loading, error, user, router, loginPath]);
  if (error)
    return (
      <main className="standalone-state">
        <ErrorState message={error} retry={() => void refreshUser()} />
        <Button variant="secondary" onClick={logout}>
          Return to login
        </Button>
      </main>
    );
  return <Loading message="Opening your workspace…" />;
}
