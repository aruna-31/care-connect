import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { savePrescription } from '../controllers/consultationController';

const router = Router();

// Doctor only route for saving prescription
router.post(
    '/:appointmentId/prescription',
    authenticateToken,
    requireRole('doctor'),
    savePrescription
);

export default router;
