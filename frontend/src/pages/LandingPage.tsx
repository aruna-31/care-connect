import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-beige-50 flex flex-col items-center justify-center text-center px-4">
            <div className="max-w-4xl space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold text-slate-800 tracking-tight animate-fade-in">
                    Reimagining <span className="text-primary-500">Healthcare</span> <br />
                    <span className="text-3xl md:text-5xl font-medium text-slate-500 block mt-2">One chat at a time.</span>
                </h1>

                <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-fade-in animate-delay-100">
                    Connect with top doctors instantly. Secure, private, and effortless consultations from the comfort of your home.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animate-delay-200 pt-4">
                    <Link to="/get-started">
                        <Button size="lg" className="rounded-full px-8 bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all">
                            Get Started
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button size="lg" variant="outline" className="rounded-full px-8 border-primary-500 text-primary-500 hover:bg-accent-500/20">
                            Sign In
                        </Button>
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
            </div>
        </div>
    );
};
