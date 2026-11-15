import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as toppingsCtrl from './toppings.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', toppingsCtrl.getToppings);
router.post('/', authorize('OWNER'), toppingsCtrl.createTopping);
router.put('/:id', authorize('OWNER'), toppingsCtrl.updateTopping);
router.delete('/:id', authorize('OWNER'), toppingsCtrl.deleteTopping);

export default router;
