'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { commentService } from '@/services/comment.service';
import { errorMessage } from '@/services/api';
import { useResource } from '@/hooks/useResource';
import { formatDate, initials } from '@/lib/utils';
import { useNotice } from '@/context/NoticeContext';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
export default function CommentSection({ issueId }: { issueId: string }) {
  const { data, setData, loading, error, reload } = useResource(
    useCallback(() => commentService.list(issueId), [issueId]),
  );
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const notify = useNotice();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) {
      setSubmitError('Please enter a comment.');
      return;
    }
    setBusy(true);
    setSubmitError('');
    try {
      const comment = await commentService.create(issueId, content.trim());
      setData((current) => [...(current || []), comment]);
      setContent('');
      notify('Comment added.');
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel comments-panel">
      <div className="panel-heading">
        <h2>
          <MessageSquare size={17} />
          Discussion{data && <span className="count-badge">{data.length}</span>}
        </h2>
      </div>
      {loading ? (
        <Loading message="Loading comments…" />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.length ? (
        <ol className="comment-list">
          {data.map((comment) => (
            <li key={comment._id}>
              <span className="avatar avatar-small">
                {initials(comment.user?.name || 'U')}
              </span>
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{comment.user?.name || 'Unavailable user'}</strong>
                  <time dateTime={comment.createdAt}>
                    {formatDate(comment.createdAt, true)}
                  </time>
                </div>
                <p>{comment.content}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="comments-empty">
          No comments yet. Start the conversation.
        </p>
      )}
      <form onSubmit={submit} className="comment-form">
        <div className="field">
          <label htmlFor="comment-content">Add a comment</label>
          <textarea
            className="control"
            id="comment-content"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={5000}
            placeholder="Share an update or ask a question…"
            disabled={busy || loading || !!error}
          />
        </div>
        {submitError && <ErrorState message={submitError} />}
        <div className="form-actions">
          <Button
            type="submit"
            loading={busy}
            disabled={loading || !!error || !content.trim()}
          >
            <Send size={15} />
            {busy ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </form>
    </section>
  );
}
