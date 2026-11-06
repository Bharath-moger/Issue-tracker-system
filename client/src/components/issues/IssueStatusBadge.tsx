import type { IssueStatus } from '@/types/issue';
import { label } from '@/lib/utils';
export default function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>
      <span className="badge-dot" />
      {label(status)}
    </span>
  );
}
