import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as cashCtrl from './cash-sessions.controller.js';

const router = Router();

router.use(authenticate);

router.get('/current', cashCtrl.getCurrentSession);
router.get('/', cashCtrl.getSessions);
router.post('/open', cashCtrl.openSession);
router.post('/:id/close', cashCtrl.closeSession);

export default router;
