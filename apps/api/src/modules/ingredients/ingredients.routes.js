import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as ingCtrl from './ingredients.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', ingCtrl.getIngredients);
router.post('/', authorize('OWNER'), ingCtrl.createIngredient);
router.put('/:id', authorize('OWNER'), ingCtrl.updateIngredient);
router.post('/:id/adjust', authorize('OWNER'), ingCtrl.adjustStock);
router.get('/movements', authorize('OWNER'), ingCtrl.getMovements);

export default router;
