import { Link } from 'react-router-dom';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const RoleSelection = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-slate-900">Choose your path</h1>
                <p className="text-slate-500 mt-2">How would you like to use CareConnect?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Patient Card */}
                <Link to="/register/patient" className="group">
                    <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-primary-500 transition-all shadow-sm hover:shadow-md h-full flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <User className="w-8 h-8 text-primary-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Patient</h2>
                        <p className="text-slate-500 mb-8 flex-grow">
                            Find doctors, book appointments, and manage your health records securely.
                        </p>
                        <Button className="w-full group-hover:bg-primary-600">
                            Continue as Patient <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Link>

                {/* Doctor Card */}
                <Link to="/register/doctor" className="group">
                    <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-accent-500 transition-all shadow-sm hover:shadow-md h-full flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Stethoscope className="w-8 h-8 text-accent-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Doctor</h2>
                        <p className="text-slate-500 mb-8 flex-grow">
                            Manage your practice, consult with patients, and streamline your workflow.
                        </p>
                        <Button variant="outline" className="w-full border-accent-500 text-accent-500 hover:bg-accent-50">
                            Continue as Doctor <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Link>
            </div>

            <p className="mt-12 text-slate-500">
                Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Log in</Link>
            </p>
        </div>
    );
};
