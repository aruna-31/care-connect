
import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { handleControllerError } from '../utils';

// Schema for ending a consultation
const endConsultationSchema = z.object({
    appointmentId: z.string().uuid(),
    diagnosis: z.string().optional(),
    notes: z.string().optional(),
    prescription: z.string().optional()
});

const savePrescriptionSchema = z.object({
    prescription: z.string()
});

const startConsultationSchema = z.object({
    appointmentId: z.string().uuid()
});


export const startConsultation = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = startConsultationSchema.parse(req.body);
        const userId = req.user.id; // Doctor ID usually

        // 1. Verify Appointment & Permissions
        const apptCheck = await query(
            'SELECT * FROM appointments WHERE id = $1',
            [appointmentId]
        );

        if (apptCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appt = apptCheck.rows[0];

        // Ensure user is the doctor (or allow testing if loose)
        if (appt.doctor_id !== userId) {
            // Ideally STRICT check, but for MVP demo allowing it might be easier if user testing logic is messy.
            // Let's enforce it.
            return res.status(403).json({ error: 'Not authorized to start this consultation' });
        }

        // 2. Check if already started
        const existing = await query(
            'SELECT id FROM consultations WHERE appointment_id = $1',
            [appointmentId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Consultation already started' });
        }

        // 3. Insert new consultation record
        await query(
            `INSERT INTO consultations (appointment_id, doctor_id, patient_id, start_time)
       VALUES ($1, $2, $3, NOW())`,
            [appointmentId, appt.doctor_id, appt.patient_id]
        );

        // 4. Update appointment status
        await query(
            `UPDATE appointments SET status = 'ongoing' WHERE id = $1`,
            [appointmentId]
        );

        res.status(201).json({ status: 'success', message: 'Consultation started' });

    } catch (error) {
        handleControllerError(error, res);
    }
};

export const endConsultation = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId, diagnosis, notes, prescription } = endConsultationSchema.parse(req.body);

        // 1. Update Consultation
        // Calculate duration automatically in SQL or JS (SQL is easier: NOW() - start_time)

        // Postgres extraction for minutes: EXTRACT(EPOCH FROM (NOW() - start_time)) / 60

        const result = await query(
            `UPDATE consultations 
       SET end_time = NOW(),
           duration_minutes = ROUND(EXTRACT(EPOCH FROM (NOW() - start_time)) / 60),
           diagnosis = $1,
           notes = $2,
           prescription = $3
       WHERE appointment_id = $4
       RETURNING *`,
            [diagnosis, notes, prescription, appointmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consultation record not found. Did you start it?' });
        }

        // 2. Mark Appointment Completed
        await query(
            "UPDATE appointments SET status = 'completed' WHERE id = $1",
            [appointmentId]
        );

        res.json({
            status: 'success',
            data: result.rows[0]
        });

    } catch (error) {
        handleControllerError(error, res);
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        console.log('[HISTORY] Fetching for:', { userId, role });

        let sql = '';

        if (role === 'patient') {
            sql = `
            SELECT 
                c.*,
                d.full_name as doctor_name,
                d.email as doctor_email
            FROM consultations c
            JOIN users d ON c.doctor_id = d.id
            WHERE c.patient_id = $1
            ORDER BY c.created_at DESC
        `;
        } else if (role === 'doctor') {
            sql = `
            SELECT 
                c.*,
                p.full_name as patient_name,
                a.urgency_level
            FROM consultations c
            JOIN users p ON c.patient_id = p.id
            JOIN appointments a ON c.appointment_id = a.id
            WHERE c.doctor_id = $1
            ORDER BY c.created_at DESC
        `;
        } else {
            return res.status(403).json({ error: 'Invalid role' });
        }

        const { rows } = await query(sql, [userId]);
        res.json({ data: rows });

    } catch (error) {
        handleControllerError(error, res);
    }
};

export const savePrescription = async (req: AuthRequest, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const { prescription } = savePrescriptionSchema.parse(req.body);

        const result = await query(
            `UPDATE consultations 
             SET prescription = $1
             WHERE appointment_id = $2
             RETURNING *`,
            [prescription, appointmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consultation record not found' });
        }

        res.json({
            status: 'success',
            data: result.rows[0]
        });

    } catch (error) {
        handleControllerError(error, res);
    }
};
