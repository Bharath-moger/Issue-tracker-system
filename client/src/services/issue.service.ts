import api, { type ApiResponse } from './api';
import type {
  Issue,
  IssueInput,
  IssueList,
  IssueQuery,
  IssueStatus,
  IssueUpdate,
} from '@/types/issue';
export const issueService = {
  list: async (query: IssueQuery) => {
    const params = Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== '' && value !== undefined,
      ),
    );
    return (await api.get<ApiResponse<IssueList>>('/issues', { params })).data
      .data;
  },
  get: async (id: string) =>
    (await api.get<ApiResponse<Issue>>(`/issues/${id}`)).data.data,
  create: async (input: IssueInput) =>
    (await api.post<ApiResponse<Issue>>('/issues', input)).data.data,
  update: async (id: string, input: IssueUpdate) =>
    (await api.patch<ApiResponse<Issue>>(`/issues/${id}`, input)).data.data,
  remove: async (id: string) => {
    await api.delete(`/issues/${id}`);
  },
  status: async (id: string, status: IssueStatus) =>
    (await api.patch<ApiResponse<Issue>>(`/issues/${id}/status`, { status }))
      .data.data,
  assign: async (id: string, assignedTo: string | null) =>
    (
      await api.patch<ApiResponse<Issue>>(`/issues/${id}/assign`, {
        assignedTo,
      })
    ).data.data,
};
