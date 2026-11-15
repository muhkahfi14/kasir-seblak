import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as salesCtrl from './sales.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', salesCtrl.getSales);
router.get('/:id', salesCtrl.getSaleDetail);
router.post('/', salesCtrl.createSale);
router.post('/:id/cancel', authorize('OWNER'), salesCtrl.cancelSale);
router.post('/:id/refund', authorize('OWNER'), salesCtrl.refundSale);

export default router;
