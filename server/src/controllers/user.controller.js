import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import { fail, ok } from '../utils/http.js';
export async function list(_req, res) { return ok(res, 'Users retrieved', await User.find().sort({ createdAt: -1 })); }
export async function get(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw fail(404, 'User not found');
  return ok(res, 'User retrieved', user);
}
export async function update(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!user) throw fail(404, 'User not found');
  return ok(res, 'User updated', user);
}
export async function remove(req, res) {
  if (req.user.id === req.params.id) throw fail(409, 'Cannot delete the currently logged-in admin');
  const user = await User.findById(req.params.id);
  if (!user) throw fail(404, 'User not found');
  if (await Issue.exists({ $or: [{ createdBy: user._id }, { assignedTo: user._id }] }) || await Comment.exists({ user: user._id })) throw fail(409, 'User is referenced by issues or comments and cannot be deleted');
  await user.deleteOne();
  return ok(res, 'User deleted');
}
