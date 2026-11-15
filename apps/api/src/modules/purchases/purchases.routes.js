import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as purCtrl from './purchases.controller.js';

const router = Router();

router.use(authenticate);

// Suppliers
router.get('/suppliers', purCtrl.getSuppliers);
router.post('/suppliers', authorize('OWNER'), purCtrl.createSupplier);

// Purchases
router.get('/', purCtrl.getPurchases);
router.post('/', authorize('OWNER'), purCtrl.createPurchase);

export default router;
