'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  PRIORITIES,
  type Issue,
  type IssueInput,
  type Priority,
} from '@/types/issue';
import { label } from '@/lib/utils';
import { errorMessage } from '@/services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ErrorState from '@/components/ui/ErrorState';
import AssigneeSelect from './AssigneeSelect';
export default function IssueForm({
  initialIssue,
  onSubmit,
  onCancel,
}: {
  initialIssue?: Issue;
  onSubmit: (input: IssueInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [assignee, setAssignee] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: IssueInput = {
      title: String(values.get('title')).trim(),
      description: String(values.get('description')).trim(),
      priority: values.get('priority') as Priority,
    };
    if (!input.title || !input.description) {
      setError('Please enter a title and description.');
      return;
    }
    if (!initialIssue && user?.role === 'ADMIN' && assignee)
      input.assignedTo = assignee;
    setBusy(true);
    setError('');
    try {
      await onSubmit(input);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      {error && <ErrorState message={error} />}
      <Input
        name="title"
        label="Issue title"
        placeholder="A short, descriptive title"
        defaultValue={initialIssue?.title}
        required
        maxLength={200}
        disabled={busy}
      />
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="control"
          rows={7}
          placeholder="Describe the issue, what you expected, and any useful context…"
          defaultValue={initialIssue?.description}
          required
          maxLength={10000}
          disabled={busy}
        />
        <p className="field-hint">
          Include enough detail for someone else to take the next step.
        </p>
      </div>
      <div className="form-columns">
        <Select
          label="Priority"
          name="priority"
          defaultValue={initialIssue?.priority || 'MEDIUM'}
          disabled={busy}
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {label(priority)}
            </option>
          ))}
        </Select>
        {!initialIssue && user?.role === 'ADMIN' && (
          <AssigneeSelect
            value={assignee}
            onChange={setAssignee}
            disabled={busy}
          />
        )}
      </div>
      {!initialIssue && (
        <div className="info-message">
          New issues start with an <strong>Open</strong> status.
        </div>
      )}
      <div className="form-actions">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : (
          <Link
            href="/issues"
            className="btn btn-secondary"
            aria-disabled={busy}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Cancel
          </Link>
        )}
        <Button type="submit" loading={busy}>
          {busy ? 'Saving…' : initialIssue ? 'Save changes' : 'Create issue'}
        </Button>
      </div>
    </form>
  );
}
