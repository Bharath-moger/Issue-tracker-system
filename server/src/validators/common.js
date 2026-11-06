import { body, param, validationResult } from 'express-validator';
import { fail } from '../utils/http.js';
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw fail(400, errors.array().map(e => e.msg).join('; '));
  next();
}
export const id = [param('id').isMongoId().withMessage('Invalid ID'), validate];
export const fields = allowed => (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw fail(400, 'JSON object required');
  if (Object.keys(req.body).some(k => !allowed.includes(k))) throw fail(400, 'Unsupported field');
  if (!Object.keys(req.body).length) throw fail(400, 'Request body is empty');
  next();
};
export const name = () => body('name').isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage('Name must contain 1–100 characters');
export const email = () => body('email').isString().bail().trim().isEmail().withMessage('Valid email required').toLowerCase();
export const password = () => body('password').isString().bail().isLength({ min: 8 }).custom(v => Buffer.byteLength(v, 'utf8') <= 72).withMessage('Password must contain at least 8 characters and at most 72 bytes');
