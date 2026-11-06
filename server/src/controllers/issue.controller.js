import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import { accessibleIssue, validateAssignee, populate, scope } from '../utils/issue-access.js';
import { fail, ok } from '../utils/http.js';
export async function create(req, res) {
  if (req.user.role !== 'ADMIN' && req.body.assignedTo != null) throw fail(403, 'Only admins can assign issues');
  await validateAssignee(req.body.assignedTo);
  const issue = await Issue.create({ ...req.body, createdBy: req.user._id, status: 'OPEN' });
  return ok(res, 'Issue created successfully', await issue.populate(populate), 201);
}
export async function list(req, res) {
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 10);
  const filter = scope(req.user);
  for (const key of ['status', 'priority', 'assignedTo']) if (req.query[key]) filter[key] = req.query[key];
  if (req.query.search) filter.title = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [issues, totalRecords] = await Promise.all([Issue.find(filter).populate(populate).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), Issue.countDocuments(filter)]);
  return ok(res, 'Issues retrieved', { issues, totalRecords, currentPage: page, totalPages: Math.ceil(totalRecords / limit) });
}
export async function get(req, res) { return ok(res, 'Issue retrieved', await (await accessibleIssue(req)).populate(populate)); }
export async function update(req, res) {
  const issue = await accessibleIssue(req);
  if (req.user.role !== 'ADMIN' && !issue.createdBy.equals(req.user._id)) throw fail(403, 'Only the creator or an admin can edit this issue');
  Object.assign(issue, req.body);
  await issue.save();
  return ok(res, 'Issue updated', await issue.populate(populate));
}
export async function remove(req, res) {
  const issue = await accessibleIssue(req);
  await Comment.deleteMany({ issue: issue._id });
  await issue.deleteOne();
  return ok(res, 'Issue deleted');
}
export async function status(req, res) {
  const issue = await accessibleIssue(req);
  if (req.user.role !== 'ADMIN' && !issue.assignedTo?.equals(req.user._id)) throw fail(403, 'Only the assignee or an admin can update status');
  issue.status = req.body.status;
  await issue.save();
  return ok(res, 'Status updated', await issue.populate(populate));
}
export async function assign(req, res) {
  const issue = await accessibleIssue(req);
  await validateAssignee(req.body.assignedTo);
  issue.assignedTo = req.body.assignedTo;
  await issue.save();
  return ok(res, 'Assignment updated', await issue.populate(populate));
}
