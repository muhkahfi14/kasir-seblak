import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as reportCtrl from './reports.controller.js';

const router = Router();

router.use(authenticate);

// Reports summary
router.get('/dashboard', reportCtrl.getDashboardSummary);
router.get('/pnl', authorize('OWNER'), reportCtrl.getProfitLossReport);

// Excel exports
router.get('/export/sales', authorize('OWNER'), reportCtrl.exportSalesToExcel);
router.get('/export/inventory', authorize('OWNER'), reportCtrl.exportInventoryToExcel);

export default router;
