import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as expCtrl from './expenses.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', expCtrl.getExpenses);
router.post('/', expCtrl.createExpense);
router.delete('/:id', authorize('OWNER'), expCtrl.deleteExpense);

export default router;
