'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/hooks/useAuth';
import { useNotice } from '@/context/NoticeContext';
import { userService } from '@/services/user.service';
import { errorMessage } from '@/services/api';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
export default function UserDialog({
  id,
  mode,
  onClose,
  onSaved,
}: {
  id: string;
  mode: 'view' | 'edit';
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const {
    data: user,
    loading,
    error,
    reload,
  } = useResource(useCallback(() => userService.get(id), [id]));
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { user: currentUser, refreshUser } = useAuth();
  const notify = useNotice();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name')).trim(),
      email = String(values.get('email')).trim();
    if (!name) {
      setSaveError('Please enter a name.');
      return;
    }
    setBusy(true);
    setSaveError('');
    try {
      const updated = await userService.update(id, { name, email });
      onSaved(updated);
      if (currentUser?._id === id) await refreshUser();
      notify('User updated successfully.');
      onClose();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'view' ? 'User details' : 'Edit user'}
      busy={busy}
    >
      {loading ? (
        <Loading message="Loading user…" />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        user &&
        (mode === 'view' ? (
          <>
            <dl className="profile-details">
              <div>
                <dt>Full name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Email address</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{user.role === 'ADMIN' ? 'Administrator' : 'User'}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
            <div className="form-actions">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="form-stack">
            {saveError && <ErrorState message={saveError} />}
            <Input
              label="Full name"
              name="name"
              defaultValue={user.name}
              maxLength={100}
              required
              disabled={busy}
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              defaultValue={user.email}
              maxLength={254}
              required
              disabled={busy}
            />
            <p className="field-hint">
              Role and password cannot be changed here.
            </p>
            <div className="form-actions">
              <Button variant="secondary" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Save changes
              </Button>
            </div>
          </form>
        ))
      )}
    </Modal>
  );
}
