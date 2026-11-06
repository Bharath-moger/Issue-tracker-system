import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { fail } from './http.js';
export const scope = user => user.role === 'ADMIN' ? {} : { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
export const populate = [{ path: 'createdBy', select: 'name email role' }, { path: 'assignedTo', select: 'name email role' }];
export async function accessibleIssue(req) {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw fail(404, 'Issue not found');
  if (req.user.role !== 'ADMIN' && !issue.createdBy.equals(req.user._id) && !issue.assignedTo?.equals(req.user._id)) throw fail(403, 'Access denied');
  return issue;
}
export async function validateAssignee(value) {
  if (value === null || value === undefined) return;
  if (!await User.exists({ _id: value, role: 'USER' })) throw fail(400, 'Assignee must be an existing USER');
}
