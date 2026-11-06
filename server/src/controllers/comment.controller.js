import Comment from '../models/Comment.js';
import { accessibleIssue } from '../utils/issue-access.js';
import { ok } from '../utils/http.js';
export async function list(req, res) {
  const issue = await accessibleIssue(req);
  return ok(res, 'Comments retrieved', await Comment.find({ issue: issue._id }).populate('user', 'name').sort({ createdAt: 1, _id: 1 }));
}
export async function create(req, res) {
  const issue = await accessibleIssue(req);
  const comment = await Comment.create({ issue: issue._id, user: req.user._id, content: req.body.content });
  return ok(res, 'Comment created', await comment.populate('user', 'name'), 201);
}
