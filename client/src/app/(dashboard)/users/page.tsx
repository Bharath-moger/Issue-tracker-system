'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UsersManager from '@/components/users/UsersManager';
import EmptyState from '@/components/ui/EmptyState';
export default function UsersPage() {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN')
    return (
      <section className="panel">
        <EmptyState
          title="Administrator access required"
          description="User management is available to administrators only."
          action={
            <Link href="/dashboard" className="btn btn-primary">
              Back to dashboard
            </Link>
          }
        />
      </section>
    );
  return <UsersManager />;
}
