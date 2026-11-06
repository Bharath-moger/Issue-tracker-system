'use client';
import { useResource } from '@/hooks/useResource';
import { userService } from '@/services/user.service';
import Select from '@/components/ui/Select';
import ErrorState from '@/components/ui/ErrorState';
export default function AssigneeSelect({
  value,
  onChange,
  disabled,
  id = 'assignee',
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const { data, loading, error, reload } = useResource(userService.list);
  return (
    <div>
      <Select
        label="Assignee"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading || !!error}
      >
        <option value="">
          {loading ? 'Loading team members…' : 'Unassigned'}
        </option>
        {data
          ?.filter((user) => user.role === 'USER')
          .map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
      </Select>
      {error && <ErrorState message={error} retry={reload} />}
      <p className="field-hint">
        Assign to a team member, or leave unassigned.
      </p>
    </div>
  );
}
