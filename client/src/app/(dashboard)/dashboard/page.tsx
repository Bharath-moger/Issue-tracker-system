'use client';
import Link from 'next/link';
import {
  Plus,
  Layers2,
  CircleDot,
  Clock3,
  CircleCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useResource';
import { dashboardService } from '@/services/dashboard.service';
import PageHeading from '@/components/ui/PageHeading';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentIssues from '@/components/dashboard/RecentIssues';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource(dashboardService.stats);
  const admin = user?.role === 'ADMIN';
  return (
    <>
      <PageHeading
        eyebrow={admin ? 'WORKSPACE OVERVIEW' : 'MY WORKSPACE'}
        title="Dashboard"
        description={
          admin
            ? 'A clear view of your team’s issues and progress.'
            : 'Keep track of the issues you created and the work assigned to you.'
        }
        action={
          <Link href="/issues/new" className="btn btn-primary">
            <Plus size={17} />
            Create issue
          </Link>
        }
      />
      {loading ? (
        <div className="panel mb-7">
          <Loading message="Loading statistics…" />
        </div>
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        data && (
          <div className="stats-grid">
            <StatsCard
              title="Total issues"
              value={data.totalIssues}
              icon={Layers2}
              tone="neutral"
              description={
                admin ? 'Across the workspace' : 'Created by or assigned to you'
              }
            />
            <StatsCard
              title="Open"
              value={data.openIssues}
              icon={CircleDot}
              tone="blue"
              description="Ready to be picked up"
            />
            <StatsCard
              title="In progress"
              value={data.inProgressIssues}
              icon={Clock3}
              tone="amber"
              description="Currently being worked on"
            />
            <StatsCard
              title="Closed"
              value={data.closedIssues}
              icon={CircleCheck}
              tone="green"
              description="Resolved and completed"
            />
          </div>
        )
      )}
      {data && !error && !loading && (
        <div className="assignment-summary">
          <span>
            <span className="summary-dot" />
            <strong>{data.myAssignedIssues}</strong>{' '}
            {data.myAssignedIssues === 1 ? 'issue assigned' : 'issues assigned'}{' '}
            to you
          </span>
          <Link href="/issues" className="text-link">
            Explore issues
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <RecentIssues />
      <div className="dashboard-footnote">
        <CircleCheck size={16} />
        <span>Clear ownership. Shared progress. One issue at a time.</span>
      </div>
    </>
  );
}
