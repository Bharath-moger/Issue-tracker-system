import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import * as validator from '../validators/auth.validator.js';
import auth from '../middleware/auth.middleware.js';
const router = Router();
router.post('/register', validator.register, controller.register);
router.post('/login', validator.login, controller.login);
router.get('/me', auth, controller.me);
export default router;
