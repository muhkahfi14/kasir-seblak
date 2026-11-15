import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as menuCtrl from './menu.controller.js';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', menuCtrl.getCategories);
router.post('/categories', authorize('OWNER'), menuCtrl.createCategory);

// Menu items
router.get('/items', menuCtrl.getMenuItems);
router.post('/items', authorize('OWNER'), menuCtrl.createMenuItem);
router.put('/items/:id', authorize('OWNER'), menuCtrl.updateMenuItem);
router.delete('/items/:id', authorize('OWNER'), menuCtrl.deleteMenuItem);

export default router;
