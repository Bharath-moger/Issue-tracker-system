'use client';
import { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useResource';
import { useNotice } from '@/context/NoticeContext';
import { userService } from '@/services/user.service';
import { errorMessage } from '@/services/api';
import { formatDate, initials } from '@/lib/utils';
import type { User } from '@/types/user';
import PageHeading from '@/components/ui/PageHeading';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import UserDialog from './UserDialog';
export default function UsersManager() {
  const { user: currentUser } = useAuth();
  const { data, setData, loading, error, reload } = useResource(
    userService.list,
  );
  const [selected, setSelected] = useState<{
    id: string;
    mode: 'view' | 'edit';
  } | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const notify = useNotice();
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError('');
    try {
      await userService.remove(deleting._id);
      setData((current) =>
        current?.filter((user) => user._id !== deleting._id),
      );
      setDeleting(null);
      notify('User deleted successfully.');
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Users"
        description="Manage the people in your workspace."
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>
            Workspace members
            {data && <span className="count-badge">{data.length}</span>}
          </h2>
          <span className="muted text-sm">Administrator access</span>
        </div>
        {loading ? (
          <Loading message="Loading users…" />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : data?.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label="Users table"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email address</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <span className="table-person">
                        <span className="avatar avatar-small">
                          {initials(user.name)}
                        </span>
                        <span className="font-medium">
                          {user.name}
                          {user._id === currentUser?._id && (
                            <span className="you-label">You</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : ''}`}
                      >
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="icon-button"
                          aria-label={`View ${user.name}`}
                          onClick={() =>
                            setSelected({ id: user._id, mode: 'view' })
                          }
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${user.name}`}
                          onClick={() =>
                            setSelected({ id: user._id, mode: 'edit' })
                          }
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger-icon"
                          aria-label={`Delete ${user.name}`}
                          disabled={user._id === currentUser?._id}
                          title={
                            user._id === currentUser?._id
                              ? 'You cannot delete your own account'
                              : 'Delete user'
                          }
                          onClick={() => {
                            setDeleting(user);
                            setDeleteError('');
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No users found"
            description="Registered accounts will appear here."
          />
        )}
      </section>
      <p className="below-panel-note">
        Accounts linked to issues or comments are protected from deletion.
      </p>
      {selected && (
        <UserDialog
          key={`${selected.id}-${selected.mode}`}
          {...selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) =>
            setData((current) =>
              current?.map((user) =>
                user._id === updated._id ? updated : user,
              ),
            )
          }
        />
      )}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this user?"
        busy={busy}
      >
        <p className="modal-description">
          Delete the account for <strong>{deleting?.name}</strong>? Accounts
          referenced by issues or comments cannot be deleted.
        </p>
        {deleteError && <ErrorState message={deleteError} />}
        <div className="form-actions">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={() => void remove()}>
            Delete user
          </Button>
        </div>
      </Modal>
    </>
  );
}
