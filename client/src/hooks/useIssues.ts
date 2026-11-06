'use client';
import { useCallback } from 'react';
import { useResource } from './useResource';
import { issueService } from '@/services/issue.service';
import type { IssueQuery } from '@/types/issue';
export function useIssues({
  page,
  limit,
  search,
  status,
  priority,
}: IssueQuery) {
  return useResource(
    useCallback(
      () => issueService.list({ page, limit, search, status, priority }),
      [page, limit, search, status, priority],
    ),
  );
}
