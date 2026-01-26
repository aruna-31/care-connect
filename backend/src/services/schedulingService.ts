import { query } from '../db';
import { sendPatientSlotUpdateEmail, sendDoctorSlotUpdateEmail } from './emailService';

/**
 * Handles emergency slot allocation.
 * If the desired slot is taken by a lower priority appointment, it bumps them.
 * This runs INSIDE an existing transaction passed from the controller (conceptually, 
 * though our query wrapper handles standalone queries. We will simulate transaction scope here or assume caller manages it).
 * 
 * For this Proof of Concept, we assume the caller has started a transaction 'BEGIN'.
 */
export const allocateEmergencySlot = async (doctorId: string, desiredTime: string, urgency: string) => {
    // 1. Check who holds the slot
    // FOR UPDATE locks these rows to prevent race conditions during this check-and-bump
    // 1. Check who holds the slot (Overlap Detection for 30 min duration)
    // Overlap logic: Existing Start < Incoming End AND Existing End > Incoming Start
    // Incoming: desiredTime (T) to T+30
    // Existing: start_time (S) to S+30
    const conflictQuery = await query(
        `SELECT id, patient_id, urgency_level, start_time 
         FROM appointments 
         WHERE doctor_id = $1 
         AND start_time < ($2::timestamp + interval '30 minutes')
         AND (start_time + interval '30 minutes') > $2::timestamp
         AND status = 'scheduled'
         ORDER BY start_time ASC
         FOR UPDATE`,
        [doctorId, desiredTime]
    );

    if (conflictQuery.rows.length === 0) {
        // Slot is free!
        return { action: 'BOOK', time: desiredTime };
    }

    const existingAppt = conflictQuery.rows[0];

    // 2. Rules for bumping
    const isIncomingEmergency = urgency === 'EMERGENCY' || urgency === 'HIGH';
    const isExistingLowerPriority = existingAppt.urgency_level === 'NORMAL' || existingAppt.urgency_level === 'MEDIUM';

    if (isIncomingEmergency && isExistingLowerPriority) {
        // 3. Find next available slot for the bumped patient (e.g., +1 hour simple logic for PoC)
        // In real scheduling, we'd search for actual gaps. Here we just push it 1 hour later.
        const originalTime = new Date(existingAppt.start_time);
        const nextSlot = new Date(originalTime.getTime() + 60 * 60 * 1000).toISOString();

        // Important: recursion or loop needed if next slot is ALSO taken. 
        // For simplicity, we assume we just push them once or force insert (overbooking) if we must, 
        // but let's try to update to next slot. 

        await query(
            `UPDATE appointments 
             SET start_time = $1, 
                 original_start_time = $2, 
                 reschedule_reason = 'Displaced by Emergency Case' 
             WHERE id = $3`,
            [nextSlot, existingAppt.start_time, existingAppt.id]
        );

        // 4. Notify bumped patient
        // 4. Notifications & Emails for Bumped Patient

        // Fetch details of bumped patient & doctor
        const patientInfo = await query('SELECT full_name, email FROM users WHERE id = $1', [existingAppt.patient_id]);
        const doctorInfo = await query('SELECT full_name, email FROM users WHERE id = $1', [doctorId]);

        const patientName = patientInfo.rows[0]?.full_name || 'Patient';
        const patientEmail = patientInfo.rows[0]?.email;
        const doctorName = doctorInfo.rows[0]?.full_name || 'Doctor';
        const doctorEmail = doctorInfo.rows[0]?.email;

        // DB Notification
        await query(
            `INSERT INTO notifications (user_id, message, type)
             VALUES ($1, $2, 'warning')`,
            [
                existingAppt.patient_id,
                `Your appointment has been rescheduled to ${new Date(nextSlot).toLocaleString()} due to an incoming emergency case.`
            ]
        );

        // Email Notification - Patient
        if (patientEmail) {
            sendPatientSlotUpdateEmail(patientEmail, patientName, existingAppt.start_time, nextSlot)
                .catch(err => console.error("Bump Email Patient failed:", err));
        }

        // Email Notification - Doctor
        if (doctorEmail) {
            // For doctor, we notify them that the *old* patient slot moved
            // The incoming one will be notified via the main creation flow "New Appointment" email
            sendDoctorSlotUpdateEmail(doctorEmail, doctorName, nextSlot, "Incoming Emergency Patient")
                .catch(err => console.error("Bump Email Doctor failed:", err));
        }

        return { action: 'BUMPED_AND_BOOKED', time: desiredTime, bumpedApptId: existingAppt.id };
    }

    // If we can't bump (e.g., existing is also EMERGENCY), incoming must wait or find another doc
    return { action: 'CONFLICT', time: null };
};
