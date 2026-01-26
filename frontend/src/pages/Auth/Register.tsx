import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../lib/schemas';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { z } from 'zod';
import { useState } from 'react';

type RegisterForm = z.infer<typeof registerSchema>;

interface RegisterProps {
    role?: 'doctor' | 'patient';
}

export const Register = ({ role }: RegisterProps) => {
    // If no role is passed, we might redirect or show a selection (for safety), 
    // but for now we'll default to patient if somehow accessed directly without prop.
    const defaultRole = role || 'patient';

    const methods = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: defaultRole }
    });
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');

    const onSubmit = async (data: RegisterForm) => {
        try {
            setError('');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            
            // Ensure the role from prop is sent
            const payload = { ...data, role: defaultRole };
            
            console.log('[REGISTER] Registering as:', defaultRole);
            console.log('[REGISTER] Sending payload:', payload);

            const res = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            const response = await res.json();
            console.log('[REGISTER] Registration successful:', { 
                userId: response.user.id, 
                role: response.user.role,
                name: response.user.name 
            });

            // Auto-login after registration
            if (response.token && response.user) {
                login(response.token, {
                    id: String(response.user.id),
                    email: response.user.email,
                    name: response.user.name,
                    role: response.user.role
                });
                navigate('/dashboard');
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            console.error('[REGISTER] Registration error:', err);
            setError(err.message || 'Registration failed');
        }
    };

    const title = role === 'doctor' ? 'Doctor Registration' : 'Patient Registration';

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-500 text-sm mt-2">Create your account to get started</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {error}
                </div>
            )}

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField name="fullName" label="Full Name" placeholder="John Doe" />
                    <FormField name="email" label="Email" type="email" placeholder="john@example.com" />
                    <FormField name="password" label="Password" type="password" placeholder="••••••••" />

                    <FormField name="phoneNumber" label="Phone Number" placeholder="+1 234 567 8900" />

                    {defaultRole === 'doctor' && (
                        <>
                            <div className="pt-2 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3">Professional Details</h3>
                                <div className="space-y-4">
                                    <FormField name="doctorId" label="Medical License / Doctor ID" placeholder="MD-123456" />
                                    <FormField name="specialization" label="Specialization" placeholder="Cardiologist, Dermatologist..." />
                                    <FormField name="availableTimings" label="Available Timings" placeholder="Mon-Fri, 9am - 5pm" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Hidden role field or just logically handled */}
                    <input type="hidden" {...methods.register('role')} value={defaultRole} />

                    <Button type="submit" className="w-full mt-2" isLoading={methods.formState.isSubmitting}>
                        Create Account
                    </Button>
                </form>
            </FormProvider>

            <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
            </p>

            <p className="mt-2 text-center text-xs text-slate-400">
                <Link to="/get-started" className="hover:text-slate-600">Change Role</Link>
            </p>
        </div>
    );
};
