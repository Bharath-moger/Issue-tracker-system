import { fail } from '../utils/http.js';
export default function authorize(...roles) {
  return (req, _res, next) => { if (!roles.includes(req.user.role)) throw fail(403, 'Access denied'); next(); };
}
