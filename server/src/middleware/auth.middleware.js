import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/http.js';
export default async function authenticate(req, _res, next) {
  const match = req.headers.authorization?.match(/^Bearer (\S+)$/i);
  if (!match) throw fail(401, 'Bearer token required');
  let payload;
  try { payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw fail(401, 'Invalid or expired token'); }
  if (typeof payload.sub !== 'string' || !/^[a-f0-9]{24}$/i.test(payload.sub)) throw fail(401, 'Invalid token');
  req.user = await User.findById(payload.sub);
  if (!req.user) throw fail(401, 'Account no longer exists');
  next();
}
