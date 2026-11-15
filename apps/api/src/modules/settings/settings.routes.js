import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as setCtrl from './settings.controller.js';

const router = Router();

router.use(authenticate);

// Store Settings
router.get('/store', setCtrl.getStoreSettings);
router.put('/store', authorize('OWNER'), setCtrl.updateStoreSettings);

// User Management (Owner only)
router.get('/users', authorize('OWNER'), setCtrl.getUsers);
router.post('/users', authorize('OWNER'), setCtrl.createUser);
router.patch('/users/:id/toggle', authorize('OWNER'), setCtrl.toggleUserStatus);

export default router;
