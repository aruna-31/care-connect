import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.discriminatedUnion('role', [
    z.object({
        role: z.literal('patient'),
        fullName: z.string().min(2, 'Name is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phoneNumber: z.string().optional(), // Optional for patients
    }),
    z.object({
        role: z.literal('doctor'),
        fullName: z.string().min(2, 'Name is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phoneNumber: z.string().min(10, 'Phone number is required'),
        doctorId: z.string().min(1, 'Doctor ID / License is required'),
        specialization: z.string().min(2, 'Specialization is required'),
        // Simple text input for now, or comma separated
        availableTimings: z.string().min(1, 'Availability is required (e.g. 9am-5pm)'),
    })
]);

export const appointmentSchema = z.object({
    doctorId: z.string(),
    date: z.string(),
    // Patient Details
    patientName: z.string().min(2, 'Patient name is required'),
    email: z.string().email('Invalid email'),
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    // Medical Info
    symptoms: z.string().min(10, 'Please describe symptoms in detail'),
    medicalHistory: z.string().optional(),
    severity: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(5)), // HTMl select returns string often
});
