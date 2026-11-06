'use client';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  STATUSES,
  PRIORITIES,
  type IssueStatus,
  type Priority,
} from '@/types/issue';
import { label } from '@/lib/utils';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
export default function IssueFilters({
  search,
  status,
  priority,
  onSearch,
  onStatus,
  onPriority,
  onReset,
}: {
  search: string;
  status: IssueStatus | '';
  priority: Priority | '';
  onSearch: (value: string) => void;
  onStatus: (value: IssueStatus | '') => void;
  onPriority: (value: Priority | '') => void;
  onReset: () => void;
}) {
  return (
    <div className="issue-filters">
      <div className="search-field">
        <label htmlFor="issue-search" className="sr-only">
          Search issues
        </label>
        <Search size={17} aria-hidden="true" />
        <input
          id="issue-search"
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          maxLength={200}
          placeholder="Search issues by title…"
          className="control"
        />
      </div>
      <div className="filter-selects">
        <SlidersHorizontal
          size={16}
          className="filter-icon"
          aria-hidden="true"
        />
        <Select
          label="Status"
          id="filter-status"
          value={status}
          onChange={(event) => onStatus(event.target.value as IssueStatus | '')}
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </Select>
        <Select
          label="Priority"
          id="filter-priority"
          value={priority}
          onChange={(event) => onPriority(event.target.value as Priority | '')}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </Select>
        {(search || status || priority) && (
          <Button variant="ghost" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
