import { Button } from '../../components/ui/Button';
import { Video, Plus, Clock, User, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PatientConsultationHistory } from '../../components/dashboard/PatientConsultationHistory';
import { DoctorConsultationHistory } from '../../components/dashboard/DoctorConsultationHistory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    console.log('[DASHBOARD] Current user:', { id: user?.id, role: user?.role, name: user?.name });

    const { data: appointments, isLoading, error, refetch } = useQuery({
        queryKey: ['appointments', user?.id],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token');
            }

            console.log('[DASHBOARD] Fetching appointments for user:', { id: user?.id, role: user?.role });

            const res = await fetch(`${API_URL}/api/v1/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Failed to fetch appointments' }));
                throw new Error(errorData.error || 'Failed to fetch appointments');
            }

            const data = await res.json();
            console.log('[DASHBOARD] Appointments fetched:', data);
            return data;
        },
        enabled: !!user, // Only fetch when user is available
        retry: 1
    });

    const list = appointments?.data || [];

    console.log('[DASHBOARD] Appointments list:', list);
    console.log('[DASHBOARD] Loading state:', isLoading);
    console.log('[DASHBOARD] Error state:', error);

    // --- Fetch History Logic ---
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['consultationHistory', user?.id],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            if (!token) return { data: [] };

            const res = await fetch(`${API_URL}/api/v1/consultations/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!user
    });

    const historyList = historyData?.data || [];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-2">Welcome back, {user?.name}</p>
                    {user?.role && (
                        <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
                            {user.role}
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    {!isLoading && (
                        <Button variant="ghost" onClick={() => refetch()}>
                            Refresh
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => navigate('/admin/db')}>
                        Database
                    </Button>
                    {user?.role === 'patient' && (
                        <Button onClick={() => navigate('/appointments/new')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Book Appointment
                        </Button>
                    )}
                </div>
            </div>

            {/* UPCOMING APPOINTMENTS SECTION */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    {user?.role === 'doctor' ? 'Upcoming Patient Appointments' : 'Your Upcoming Appointments'}
                </h2>

                {isLoading ? (
                    <div className="bg-slate-50 p-12 rounded-xl text-center text-slate-500 animate-pulse">
                        Loading appointments...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-8 rounded-xl text-center text-red-600 border border-red-100">
                        <p className="font-medium">Error loading appointments</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                ) : list.length === 0 ? (
                    <div className="bg-slate-50 p-12 rounded-xl text-center text-slate-500 border border-slate-200 border-dashed">
                        {user?.role === 'doctor'
                            ? 'No upcoming appointments scheduled.'
                            : 'No upcoming appointments. Book your first appointment to get started!'}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {list.map((appt: any) => (
                            <div key={appt.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="font-semibold text-lg text-slate-900">
                                            {new Date(appt.start_time).toLocaleString(undefined, {
                                                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            })}
                                        </div>
                                        {appt.urgency_level && appt.urgency_level !== 'NORMAL' && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold
                                                ${appt.urgency_level === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {appt.urgency_level}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        {user?.role === 'doctor'
                                            ? `Patient: ${appt.other_party_name}`
                                            : `Doctor: ${appt.other_party_name}`}
                                    </div>
                                </div>

                                <Button
                                    className="w-full sm:w-auto transition-transform active:scale-95"
                                    onClick={() => navigate(`/consultation/${appt.id}`)}
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Join Call
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HISTORY SECTION */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    {user?.role === 'doctor' ? 'Past Consultations' : 'Consultation History'}
                </h2>

                {historyLoading ? (
                    <div className="text-slate-400 text-sm">Loading history...</div>
                ) : (
                    user?.role === 'patient'
                        ? <PatientConsultationHistory history={historyList} />
                        : <DoctorConsultationHistory history={historyList} />
                )}
            </div>
        </div>
    );
};
