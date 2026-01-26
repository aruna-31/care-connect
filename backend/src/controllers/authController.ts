import { z } from 'zod';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { handleControllerError } from '../utils';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['doctor', 'patient']),
    // Optional/conditional fields based on role (simplifying validation here, strict on frontend/conditional logic)
    phoneNumber: z.string().optional(),
    doctorId: z.string().optional(),
    specialization: z.string().optional(),
    availableTimings: z.string().optional(),
});

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        console.log('[LOGIN] Login attempt for email:', email);
        
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log('[LOGIN] User not found for email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log('[LOGIN] User found:', { id: user.id, email: user.email, role: user.role });
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('[LOGIN] Password mismatch for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // JWT payload: only id and role as per requirements
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });

        console.log('[LOGIN] User logged in:', { id: user.id, role: user.role, email: user.email });
        console.log('[LOGIN] JWT payload:', { id: user.id, role: user.role });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.full_name } });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, role, phoneNumber, doctorId, specialization, availableTimings } = registerSchema.parse(req.body);

        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);

        // 1. Create User
        const result = await query(
            'INSERT INTO users (email, password_hash, full_name, role, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, hash, fullName, role, phoneNumber || null]
        );
        const userId = result.rows[0].id;

        // 2. Create Profile
        if (role === 'doctor') {
            if (!doctorId || !specialization) {
                return res.status(400).json({ error: 'Doctor ID and Specialization are required for doctors' });
            }
            await query(
                'INSERT INTO doctor_profiles (user_id, license_number, specialty, availability_config) VALUES ($1, $2, $3, $4)',
                [userId, doctorId, specialization, JSON.stringify({ timings: availableTimings })]
            );
        }

        // Generate JWT token for the newly registered user
        const token = jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });

        console.log('[REGISTER] User registered:', { id: userId, role: role, email: email });
        console.log('[REGISTER] JWT payload:', { id: userId, role: role });

        // Fetch user data for response
        const userResult = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [userId]);
        const newUser = userResult.rows[0];

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.full_name
            }
        });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        console.log('[GET ME] Request from user:', { id: userId, role: userRole });
        
        const result = await query('SELECT id, email, full_name as name, role FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            console.error('[GET ME] User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('[GET ME] User found:', result.rows[0]);
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('[GET ME] Error:', error);
        handleControllerError(error, res);
    }
};

