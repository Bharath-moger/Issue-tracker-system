import { body } from 'express-validator';
import { fields, name, email, password, validate } from './common.js';
export const register = [fields(['name', 'email', 'password']), name(), email(), password(), validate];
export const login = [fields(['email', 'password']), email(), body('password').isString().notEmpty(), validate];
