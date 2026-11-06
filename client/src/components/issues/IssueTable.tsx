import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatDate, initials } from '@/lib/utils';
import type { Issue } from '@/types/issue';
import IssueStatusBadge from './IssueStatusBadge';
import PriorityBadge from './PriorityBadge';
export default function IssueTable({
  issues,
  compact = false,
}: {
  issues: Issue[];
  compact?: boolean;
}) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label={compact ? 'Recent issues' : 'Issues table'}
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>Issue title</th>
            <th>Priority</th>
            <th>Status</th>
            {!compact && <th>Created by</th>}
            <th>Assigned to</th>
            <th>Created date</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue._id}>
              <td className="issue-title-cell">
                <Link href={`/issues/${issue._id}`} className="issue-title">
                  {issue.title}
                </Link>
                <span className="issue-reference">
                  #{issue._id.slice(-6).toUpperCase()}
                </span>
              </td>
              <td>
                <PriorityBadge priority={issue.priority} />
              </td>
              <td>
                <IssueStatusBadge status={issue.status} />
              </td>
              {!compact && (
                <td>
                  <span className="person-name">
                    {issue.createdBy?.name || 'Unavailable user'}
                  </span>
                </td>
              )}
              <td>
                {issue.assignedTo ? (
                  <span className="table-person">
                    <span className="avatar avatar-small">
                      {initials(issue.assignedTo.name)}
                    </span>
                    <span>{issue.assignedTo.name}</span>
                  </span>
                ) : (
                  <span className="muted">Unassigned</span>
                )}
              </td>
              <td className="date-cell">{formatDate(issue.createdAt)}</td>
              <td>
                <Link
                  href={`/issues/${issue._id}`}
                  className="icon-button"
                  aria-label={`View ${issue.title}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
