import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '../../lib/schemas';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AppointmentDetail = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const isNew = location.pathname.includes('/new');

    console.log('[APPOINTMENT DETAIL] User:', { id: user?.id, role: user?.role });
    console.log('[APPOINTMENT DETAIL] Is new appointment:', isNew);

    // Default edit mode if creating new
    const [isEditing, setIsEditing] = useState(isNew);

    const methods = useForm({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            doctorId: '', // Empty for auto-assign
            date: '',
            patientName: user?.name || '',
            email: user?.email || '',
            phoneNumber: '',
            symptoms: '',
            medicalHistory: '',
            severity: '1'
        }
    });

    // If viewing existing, we'd fetch data here. For now, let's focus on the booking flow.
    // TODO: Add useQuery for fetching existing appointment details if !isNew

    const onSubmit = async (data: any) => {
        try {
            const token = localStorage.getItem('token');
            
            // Validate date field exists
            if (!data.date) {
                throw new Error('Date and time are required');
            }

            // Convert datetime-local to ISO string
            // datetime-local format: "YYYY-MM-DDTHH:mm" (e.g., "2026-01-23T10:00")
            // We need to ensure it's a valid ISO 8601 datetime string
            let startTime: string;
            try {
                const dateObj = new Date(data.date);
                if (isNaN(dateObj.getTime())) {
                    throw new Error('Invalid date format');
                }
                startTime = dateObj.toISOString();
            } catch (error) {
                throw new Error('Invalid date format. Please select a valid date and time.');
            }

            // Build payload with only required fields
            const payload: any = {
                patientName: data.patientName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                symptoms: data.symptoms,
                startTime: startTime,
                severity: parseInt(data.severity, 10), // String -> Number
            };

            // Add optional fields
            if (data.medicalHistory) {
                payload.medicalHistory = data.medicalHistory;
            }

            // Add doctorId only if provided and not empty
            if (data.doctorId && data.doctorId !== '') {
                payload.doctorId = data.doctorId;
            }

            console.log('[APPOINTMENT DETAIL] Booking appointment with payload:', payload);

            const res = await fetch(`${API_URL}/api/v1/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                console.error('[APPOINTMENT DETAIL] Backend error response:', JSON.stringify(err, null, 2));
                // Show detailed error message if available
                const errorMessage = err.details && Array.isArray(err.details)
                    ? `${err.error || 'Booking failed'}: ${err.details.join(', ')}`
                    : err.error || 'Booking failed';
                alert(`Booking Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const result = await res.json();
            console.log('[APPOINTMENT DETAIL] Appointment booked successfully:', result);
            
            // Invalidate and refetch appointments query to update dashboard
            await queryClient.invalidateQueries({ queryKey: ['appointments'] });
            
            alert(`Appointment Booked! ${result.data.assignedDoctor ? `Assigned to Dr. ${result.data.assignedDoctor.name} (${result.data.assignedDoctor.specialization})` : ''}`);
            navigate('/dashboard');
        } catch (error: any) {
            console.error('[APPOINTMENT DETAIL] Booking Error:', error);
            alert("Error: " + error.message);
        }
    };

    if (user?.role === 'doctor' && isNew) {
        return (
            <div className="p-8 text-center">
                Doctors cannot self-book appointments through this interface.
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden my-8">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">
                    {isNew ? 'Book New Appointment' : 'Appointment Details'}
                </h2>
                {!isNew && (
                    <div className="space-x-2">
                        {!isEditing ? (
                            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                        ) : (
                            <Button variant="ghost" onClick={() => { setIsEditing(false); methods.reset(); }}>Cancel</Button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6">
                {!isEditing && !isNew ? (
                    <div className="space-y-4">
                        <p className="text-slate-500 italic">View details functionality for existing appointments coming soon.</p>
                        <Button onClick={() => navigate('/dashboard')}>Back</Button>
                    </div>
                ) : (
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                            {!isNew && <p className="text-sm text-yellow-600 mb-4 bg-yellow-50 p-3 rounded">Editing an existing appointment.</p>}

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField name="patientName" label="Patient Name" placeholder="Full Name" />
                                <FormField name="email" label="Email Address" type="email" />
                            </div>
                            <FormField name="phoneNumber" label="Phone Number" placeholder="+1..." />

                            <FormField name="date" label="Preferred Date & Time" type="datetime-local" />

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="font-medium text-slate-900">Medical Information & Symptoms</h3>
                                <p className="text-xs text-slate-500">
                                    Our smart system will automatically assign you to a specialist based on your symptoms.
                                    (e.g., "Chest pain" &rarr; Cardiologist, "Rash" &rarr; Dermatologist)
                                </p>
                                <FormField name="symptoms" label="Current Symptoms" placeholder="E.g. Severe chest pain, skin rash, migraine..." />
                                <FormField name="medicalHistory" label="Medical History (Optional)" placeholder="Past surgeries, allergies, chronic conditions..." />

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Severity Level (1-5)</label>
                                    <select {...methods.register('severity')} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <option value="1">1 - Mild (Routine Checkup)</option>
                                        <option value="2">2 - Moderate (Discomfort)</option>
                                        <option value="3">3 - Concerning (Needs attention)</option>
                                        <option value="4">4 - Severe (Urgent)</option>
                                        <option value="5">5 - Critical / Emergency</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-4">
                                <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
                                <Button type="submit" isLoading={methods.formState.isSubmitting}>
                                    {isNew ? 'Confirm Booking' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                )}
            </div>
        </div>
    );
};
