
import { Router } from 'express';
import { rawQuery, listTables, getTableData } from '../controllers/adminController';

const router = Router();

// For developer convenience, we are NOT enforcing auth here currently so you can access it easily.
// In a real app, `router.use(authenticateToken, requireRole('admin'));` would be mandatory.

router.post('/query', rawQuery);
router.get('/tables', listTables);
router.get('/tables/:tableName', getTableData);

export default router;
