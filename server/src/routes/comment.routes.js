import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/comment.controller.js';
import { id, fields, validate } from '../validators/common.js';
const router = Router({ mergeParams: true });
router.get('/', id, controller.list);
router.post('/', id, fields(['content']), body('content').isString().bail().trim().isLength({ min: 1, max: 5000 }), validate, controller.create);
export default router;
