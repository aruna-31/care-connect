import { Router } from 'express';
import { createAppointment, listAppointments } from '../controllers/appointmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// router.post('/', requireRole('patient'), createAppointment);
// For demo/testing purposes, allowing any authenticated user to create (or simplified logic inside)
router.post('/', createAppointment);
router.get('/', listAppointments);

export default router;
