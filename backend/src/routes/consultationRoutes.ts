
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { startConsultation, endConsultation, getHistory } from '../controllers/consultationController';

const router = Router();

router.use(authenticateToken);

router.post('/start', startConsultation);
router.post('/end', endConsultation);
router.get('/history', getHistory);

export default router;
