'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import type { IssueStatus, Priority } from '@/types/issue';
import PageHeading from '@/components/ui/PageHeading';
import IssueFilters from '@/components/issues/IssueFilters';
import IssueTable from '@/components/issues/IssueTable';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
export default function IssuesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<IssueStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, loading, error, reload } = useIssues({
    page,
    limit: 10,
    search: query,
    status,
    priority,
  });
  return (
    <>
      <PageHeading
        eyebrow="WORK MANAGEMENT"
        title="Issues"
        description={
          user?.role === 'ADMIN'
            ? 'Manage, assign, and move your team’s work forward.'
            : 'All the issues you created or are assigned to.'
        }
        action={
          <Link href="/issues/new" className="btn btn-primary">
            <Plus size={17} />
            Create issue
          </Link>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>
            All issues
            {data && !loading && (
              <span className="count-badge">{data.totalRecords}</span>
            )}
          </h2>
          <span className="muted text-sm">Newest first</span>
        </div>
        <IssueFilters
          search={search}
          status={status}
          priority={priority}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatus={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onPriority={(value) => {
            setPriority(value);
            setPage(1);
          }}
          onReset={() => {
            setSearch('');
            setQuery('');
            setStatus('');
            setPriority('');
            setPage(1);
          }}
        />
        {loading ? (
          <Loading message="Loading issues…" />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : data?.issues.length ? (
          <IssueTable issues={data.issues} />
        ) : (
          <EmptyState
            title={
              query || status || priority
                ? 'No matching issues'
                : 'No issues yet'
            }
            description={
              query || status || priority
                ? 'Try another search or adjust your filters.'
                : 'Create an issue to start organizing your work.'
            }
            action={
              !query && !status && !priority ? (
                <Link className="btn btn-secondary" href="/issues/new">
                  Create your first issue
                </Link>
              ) : undefined
            }
          />
        )}
        {data && !error && (
          <div className="pagination">
            <p>
              {data.totalRecords
                ? `Showing ${(data.currentPage - 1) * 10 + 1}–${Math.min(data.currentPage * 10, data.totalRecords)} of ${data.totalRecords} issues`
                : '0 issues'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="page-number">
                Page {data.totalPages ? page : 1} of{' '}
                {Math.max(1, data.totalPages)}
              </span>
              <Button
                variant="secondary"
                disabled={loading || page >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
