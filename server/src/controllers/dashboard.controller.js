import Issue from '../models/Issue.js';
import { scope } from '../utils/issue-access.js';
import { ok } from '../utils/http.js';
export async function stats(req, res) {
  const filter = scope(req.user);
  const [totalIssues, openIssues, inProgressIssues, closedIssues, myAssignedIssues] = await Promise.all([
    Issue.countDocuments(filter), Issue.countDocuments({ ...filter, status: 'OPEN' }), Issue.countDocuments({ ...filter, status: 'IN_PROGRESS' }), Issue.countDocuments({ ...filter, status: 'CLOSED' }), Issue.countDocuments({ assignedTo: req.user._id }),
  ]);
  return ok(res, 'Dashboard statistics retrieved', { totalIssues, openIssues, inProgressIssues, closedIssues, myAssignedIssues });
}
