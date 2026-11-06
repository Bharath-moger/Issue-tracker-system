import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useIssues } from '@/hooks/useIssues';
import IssueTable from '@/components/issues/IssueTable';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
export default function RecentIssues() {
  const { data, loading, error, reload } = useIssues({ page: 1, limit: 5 });
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Recent issues</h2>
          <p>The latest work across your workspace.</p>
        </div>
        <Link href="/issues" className="text-link">
          View all issues
          <ArrowRight size={15} />
        </Link>
      </div>
      {loading ? (
        <Loading message="Loading recent issues…" />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.issues.length ? (
        <IssueTable issues={data.issues} compact />
      ) : (
        <EmptyState
          title="Your workspace is clear"
          description="Create your first issue to start tracking work."
          action={
            <Link href="/issues/new" className="btn btn-secondary">
              Create an issue
            </Link>
          }
        />
      )}
    </section>
  );
}
