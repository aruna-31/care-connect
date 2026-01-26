import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../lib/schemas';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { z } from 'zod';
import { useState } from 'react';

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
    const methods = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const onSubmit = async (data: LoginForm) => {
        try {
            setError('');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            
            console.log('[LOGIN] Attempting login for:', data.email);
            
            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Invalid email or password');
            }

            const response = await res.json();
            console.log('[LOGIN] Login successful:', { 
                userId: response.user.id, 
                role: response.user.role,
                name: response.user.name 
            });

            // Store token and user data
            login(response.token, {
                id: String(response.user.id), // Convert to string for consistency
                email: response.user.email,
                name: response.user.name,
                role: response.user.role
            });
            
            navigate('/dashboard');
        } catch (err: any) {
            console.error('[LOGIN] Login error:', err);
            setError(err.message || 'Invalid email or password');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                <p className="text-slate-500 text-sm mt-2">Sign in to your account to continue</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {error}
                </div>
            )}

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        name="email"
                        label="Email Address"
                        placeholder="you@example.com"
                        type="email"
                    />
                    <FormField
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                    />

                    <Button type="submit" className="w-full" isLoading={methods.formState.isSubmitting}>
                        Sign In
                    </Button>
                </form>
            </FormProvider>

            <p className="mt-6 text-center text-sm text-slate-600">
                Don't have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
            </p>
        </div>
    );
};
