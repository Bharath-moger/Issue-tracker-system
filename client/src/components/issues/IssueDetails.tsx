'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useResource';
import { useNotice } from '@/context/NoticeContext';
import { issueService } from '@/services/issue.service';
import { errorMessage } from '@/services/api';
import { STATUSES, type Issue, type IssueStatus } from '@/types/issue';
import { formatDate, label } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ErrorState from '@/components/ui/ErrorState';
import Loading from '@/components/ui/Loading';
import IssueForm from './IssueForm';
import IssueStatusBadge from './IssueStatusBadge';
import PriorityBadge from './PriorityBadge';
import CommentSection from './CommentSection';
import AssigneeSelect from './AssigneeSelect';

function Workflow({
  issue,
  onChange,
}: {
  issue: Issue;
  onChange: (issue: Issue) => void;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState(issue.status);
  const [assignee, setAssignee] = useState(issue.assignedTo?._id || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const notify = useNotice();
  const admin = user?.role === 'ADMIN';
  const canChangeStatus = admin || issue.assignedTo?._id === user?._id;
  async function save(action: 'status' | 'assignment') {
    setBusy(action);
    setError('');
    try {
      const result =
        action === 'status'
          ? await issueService.status(issue._id, status)
          : await issueService.assign(issue._id, assignee || null);
      onChange(result);
      notify(
        action === 'status'
          ? 'Issue status updated.'
          : 'Issue assignment updated.',
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  }
  if (!admin && !canChangeStatus) return null;
  return (
    <section className="panel workflow-panel">
      <div className="panel-heading">
        <h2>Manage issue</h2>
      </div>
      <div className="form-stack">
        {error && <ErrorState message={error} />}
        {canChangeStatus && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save('status');
            }}
            className="form-stack"
          >
            <Select
              label="Status"
              id="issue-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as IssueStatus)}
              disabled={!!busy}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              variant="secondary"
              loading={busy === 'status'}
              disabled={!!busy || status === issue.status}
            >
              Update status
            </Button>
          </form>
        )}
        {admin && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save('assignment');
            }}
            className="form-stack assignment-form"
          >
            <AssigneeSelect
              id="issue-assignee"
              value={assignee}
              onChange={setAssignee}
              disabled={!!busy}
            />
            <Button
              type="submit"
              variant="secondary"
              loading={busy === 'assignment'}
              disabled={!!busy || assignee === (issue.assignedTo?._id || '')}
            >
              Save assignment
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
export default function IssueDetails({ id }: { id: string }) {
  const {
    data: issue,
    setData,
    loading,
    error,
    reload,
  } = useResource(useCallback(() => issueService.get(id), [id]));
  const { user } = useAuth();
  const router = useRouter();
  const notify = useNotice();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const admin = user?.role === 'ADMIN';
  if (loading) return <Loading message="Loading issue…" />;
  if (error || !issue)
    return (
      <>
        <Link className="back-link" href="/issues">
          <ArrowLeft size={15} />
          Back to issues
        </Link>
        <ErrorState message={error || 'Issue not found.'} retry={reload} />
      </>
    );
  const canEdit = admin || issue.createdBy?._id === user?._id;
  async function remove() {
    if (!issue) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await issueService.remove(issue._id);
      notify('Issue deleted successfully.');
      router.replace('/issues');
    } catch (err) {
      setDeleteError(errorMessage(err));
      setDeleteBusy(false);
    }
  }
  return (
    <>
      <Link href="/issues" className="back-link">
        <ArrowLeft size={15} />
        Back to issues
      </Link>
      <div className="issue-detail-heading">
        <div>
          <p className="eyebrow">ISSUE #{issue._id.slice(-6).toUpperCase()}</p>
          <h1>{issue.title}</h1>
          <div className="issue-heading-badges">
            <IssueStatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              Edit issue
            </Button>
          )}
          {admin && (
            <Button
              variant="danger"
              onClick={() => {
                setDeleting(true);
                setDeleteError('');
              }}
            >
              <Trash2 size={15} />
              Delete
            </Button>
          )}
        </div>
      </div>
      <div className="issue-detail-grid">
        <div className="issue-detail-main">
          <section className="panel">
            <div className="panel-heading">
              <h2>Description</h2>
            </div>
            <p className="issue-description">{issue.description}</p>
          </section>
          <CommentSection issueId={id} />
        </div>
        <aside className="issue-detail-aside">
          <section className="panel">
            <div className="panel-heading">
              <h2>Issue details</h2>
            </div>
            <dl className="issue-metadata">
              <div>
                <dt>
                  <UserRound size={14} />
                  Created by
                </dt>
                <dd>{issue.createdBy?.name || 'Unavailable user'}</dd>
              </div>
              <div>
                <dt>
                  <UserRound size={14} />
                  Assigned to
                </dt>
                <dd>{issue.assignedTo?.name || 'Unassigned'}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={14} />
                  Created
                </dt>
                <dd>{formatDate(issue.createdAt, true)}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={14} />
                  Last updated
                </dt>
                <dd>{formatDate(issue.updatedAt, true)}</dd>
              </div>
            </dl>
          </section>
          <Workflow
            key={`${issue._id}-${issue.status}-${issue.assignedTo?._id}`}
            issue={issue}
            onChange={setData}
          />
        </aside>
      </div>
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit issue"
      >
        <IssueForm
          key={editing ? 'open' : 'closed'}
          initialIssue={issue}
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            const updated = await issueService.update(id, {
              title: input.title,
              description: input.description,
              priority: input.priority,
            });
            setData(updated);
            setEditing(false);
            notify('Issue updated successfully.');
          }}
        />
      </Modal>
      <Modal
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this issue?"
        busy={deleteBusy}
      >
        <p className="modal-description">
          This will permanently delete “{issue.title}” and all its comments.
          This action cannot be undone.
        </p>
        {deleteError && <ErrorState message={deleteError} />}
        <div className="form-actions">
          <Button
            variant="secondary"
            disabled={deleteBusy}
            onClick={() => setDeleting(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteBusy}
            onClick={() => void remove()}
          >
            Delete issue
          </Button>
        </div>
      </Modal>
    </>
  );
}
