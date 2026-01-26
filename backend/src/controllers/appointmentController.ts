import { z } from 'zod';
import { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { handleControllerError } from '../utils';
import { calculateUrgency, detectAutoSeverity, getUrgencyEnum } from '../services/urgencyService';
import { recommendSpecialization } from '../services/recommendationService';
import { allocateEmergencySlot } from '../services/schedulingService';
import { sendPatientSlotConfirmationEmail, sendDoctorNewAppointmentEmail } from '../services/emailService';

// Schema for Appointment Creation
const createAppointmentSchema = z.object({
    doctorId: z.string().uuid().optional(), // Now optional for auto-recommendation
    startTime: z.string().datetime({ message: "startTime must be a valid ISO 8601 datetime string" }),
    // Expanded Fields
    patientName: z.string().min(2, "Patient name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
    symptoms: z.string().min(3, "Symptoms must be at least 3 characters"),
    medicalHistory: z.string().optional(),
    severity: z.number().min(1).max(5, "Severity must be between 1 and 5"),
});

export const createAppointment = async (req: AuthRequest, res: Response) => {
    try {
        console.log('[CREATE APPOINTMENT] Raw request body:', JSON.stringify(req.body, null, 2));

        // Validate request body
        const validationResult = createAppointmentSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error('[CREATE APPOINTMENT] Validation error:', validationResult.error.issues);
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }

        const { startTime, patientName, email, phoneNumber, symptoms, medicalHistory, severity } = validationResult.data;
        let { doctorId } = validationResult.data;
        const patientId = req.user.id;
        const userRole = req.user.role;

        console.log('[CREATE APPOINTMENT] User:', { id: patientId, role: userRole });
        console.log('[CREATE APPOINTMENT] Validated data:', { startTime, patientName, email, doctorId: doctorId || 'AUTO-ASSIGN', severity });

        // Auto-Recommend Doctor if not provided
        let recommendedSpecialization = null;
        if (!doctorId) {
            recommendedSpecialization = recommendSpecialization(symptoms);

            // Find a doctor with this specialization
            // Using ILIKE for case-insensitive matching roughly
            const doctorQuery = await query(
                `SELECT user_id, full_name 
                 FROM doctor_profiles 
                 JOIN users ON users.id = doctor_profiles.user_id 
                 WHERE specialty ILIKE $1 
                 LIMIT 1`,
                [`%${recommendedSpecialization}%`]
            );

            if (doctorQuery.rows.length === 0) {
                // Fallback to any General Physician if specific not found
                const fallback = await query(
                    `SELECT user_id, full_name 
                     FROM doctor_profiles 
                     JOIN users ON users.id = doctor_profiles.user_id 
                     WHERE specialty ILIKE '%General%' 
                     LIMIT 1`
                );

                if (fallback.rows.length === 0) {
                    return res.status(404).json({ error: `No doctors found for ${recommendedSpecialization} and no general physicians available.` });
                }
                doctorId = fallback.rows[0].user_id;
            } else {
                doctorId = doctorQuery.rows[0].user_id;
            }
        }

        // Calculate Urgency
        // 1. Calculate Severities
        const autoSeverity = detectAutoSeverity(symptoms);
        const reportedSeverity = severity;
        const effectiveSeverity = Math.max(reportedSeverity, autoSeverity);
        const urgencyEnum = getUrgencyEnum(effectiveSeverity); // Map numeric to Enum

        console.log('[CREATE APPOINTMENT] Severity Analysis:', {
            reported: reportedSeverity,
            auto: autoSeverity,
            effective: effectiveSeverity,
            enum: urgencyEnum
        });

        // Start Transaction
        await query('BEGIN');

        // Check & Allocate Slot (Handle Emergency Bumping) using EFFECTIVE urgency
        const allocation = await allocateEmergencySlot(doctorId as string, startTime, urgencyEnum);

        if (allocation.action === 'CONFLICT') {
            await query('ROLLBACK');
            return res.status(409).json({
                error: 'Time slot is taken by another high-priority case. Please choose another time.'
            });
        }

        // 2. Create Appointment with Severity Columns
        const apptResult = await query(
            `INSERT INTO appointments 
            (patient_id, doctor_id, start_time, status, urgency_level, reported_severity, auto_severity, final_severity) 
            VALUES ($1, $2, $3, 'scheduled', $4, $5, $6, $7) 
            RETURNING id`,
            [patientId, doctorId, allocation.time, urgencyEnum, reportedSeverity, autoSeverity, effectiveSeverity]
        );
        const appointmentId = apptResult.rows[0].id;

        // 3. Create Intake Form
        await query(
            `INSERT INTO intake_forms (appointment_id, patient_name, email, phone_number, symptom, history, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [appointmentId, patientName, email, phoneNumber, symptoms, medicalHistory || null, effectiveSeverity] // Use effective for intake as well
        );

        // 3. Create Empty Consultation Record stub
        await query(
            `INSERT INTO consultation_records (appointment_id) VALUES ($1)`,
            [appointmentId]
        );

        await query('COMMIT');

        console.log('[CREATE APPOINTMENT] Appointment created successfully:', { appointmentId, patientId, doctorId });

        // Fetch Assigned Doctor Name AND Email for notification
        const docInfo = await query('SELECT full_name, email FROM users WHERE id = $1', [doctorId]);
        const doctorName = docInfo.rows[0]?.full_name || 'Doctor';
        const doctorEmail = docInfo.rows[0]?.email;

        // --- Send Emails (Fire and forget) ---

        // 1. Patient Confirmation
        console.log(`[EMAIL DEBUG] Preparing to send confirmation to Patient Email: '${email}'`);
        sendPatientSlotConfirmationEmail(email, patientName, doctorName, allocation.time as string, urgencyEnum.toString())
            .then(() => console.log(`[EMAIL DEBUG] Success sending to ${email}`))
            .catch(err => console.error(`[EMAIL DEBUG] FAILED sending to ${email}:`, err));

        // 2. Doctor Notification
        if (doctorEmail) {
            sendDoctorNewAppointmentEmail(doctorEmail, doctorName, patientName, allocation.time as string, urgencyEnum.toString(), symptoms)
                .catch(err => console.error("Doctor Email failed:", err));
        }

        res.status(201).json({
            status: 'success',
            data: {
                id: appointmentId,
                status: 'scheduled',
                urgencyScore: urgencyEnum,
                assignedDoctor: {
                    id: doctorId,
                    name: doctorName,
                    specialization: recommendedSpecialization || 'Selected by Patient'
                }
            }
        });

    } catch (error) {
        await query('ROLLBACK');
        handleControllerError(error, res);
    }
};

export const listAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const isDoctor = userRole === 'doctor';

        console.log('[GET APPOINTMENTS] User:', { id: userId, role: userRole });
        console.log('[GET APPOINTMENTS] Filtering by:', isDoctor ? 'doctor_id' : 'patient_id');

        // Role-aware query using parameterized queries (prevents SQL injection)
        // If doctor: show appointments where doctor_id = user.id
        // If patient: show appointments where patient_id = user.id
        const sql = isDoctor
            ? `SELECT a.id, a.start_time, a.status, a.urgency_level,
                      a.reported_severity, a.auto_severity, a.final_severity,
                      u.full_name as other_party_name,
                      u.role as other_party_role
               FROM appointments a
               JOIN users u ON u.id = a.patient_id
               WHERE a.doctor_id = $1
               ORDER BY 
                   CASE 
                       WHEN a.urgency_level = 'EMERGENCY' THEN 1 
                       WHEN a.urgency_level = 'HIGH' THEN 2 
                       WHEN a.urgency_level = 'MEDIUM' THEN 3 
                       ELSE 4 
                   END ASC,
                   a.start_time ASC`
            : `SELECT a.id, a.start_time, a.status, a.urgency_level,
                      a.reported_severity, a.auto_severity, a.final_severity,
                      u.full_name as other_party_name,
                      u.role as other_party_role
               FROM appointments a
               JOIN users u ON u.id = a.doctor_id
               WHERE a.patient_id = $1
               ORDER BY a.start_time ASC`;

        console.log('[GET APPOINTMENTS] SQL Query:', sql);
        console.log('[GET APPOINTMENTS] Query params:', [userId]);

        const result = await query(sql, [userId]);

        console.log('[GET APPOINTMENTS] Found', result.rows.length, 'appointments');

        res.json({ data: result.rows });
    } catch (error) {
        console.error('[GET APPOINTMENTS] Error:', error);
        handleControllerError(error, res);
    }
};
