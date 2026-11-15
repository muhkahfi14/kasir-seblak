import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as capCtrl from './capital.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', capCtrl.getCapitalTransactions);
router.post('/', capCtrl.createCapitalTransaction);

export default router;
