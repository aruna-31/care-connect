import { Response } from 'express';

export const handleControllerError = (err: any, res: Response) => {
    console.error('[ERROR HANDLER]', err);
    if (err.name === 'ZodError') {
        const errorMessages = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ 
            error: 'Validation Error', 
            details: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        });
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
};
