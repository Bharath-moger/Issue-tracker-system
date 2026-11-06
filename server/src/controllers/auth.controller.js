import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generate-token.js';
import { fail, ok } from '../utils/http.js';
export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: 'USER' });
  return ok(res, 'Account created successfully', { user, token: generateToken(user) }, 201);
}
export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !await bcrypt.compare(req.body.password, user.password)) throw fail(401, 'Invalid email or password');
  return ok(res, 'Logged in successfully', { user, token: generateToken(user) });
}
export function me(req, res) { return ok(res, 'Profile retrieved', req.user); }
