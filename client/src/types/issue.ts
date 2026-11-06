import type { UserSummary } from './user';
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type IssueStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export interface Issue {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  status: IssueStatus;
  assignedTo: UserSummary | null;
  createdBy: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}
export interface IssueInput {
  title: string;
  description: string;
  priority: Priority;
  assignedTo?: string | null;
}
export type IssueUpdate = Pick<
  IssueInput,
  'title' | 'description' | 'priority'
>;
export interface IssueQuery {
  page: number;
  limit: number;
  search?: string;
  status?: IssueStatus | '';
  priority?: Priority | '';
}
export interface IssueList {
  issues: Issue[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
}
export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  myAssignedIssues: number;
}
