import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="text-xl font-bold text-primary-600 flex items-center gap-2">
                        <span>CareConnect</span>
                    </Link>
                    <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-600">
                        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
                        <Link to="/appointments" className="hover:text-primary-600">Appointments</Link>
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <span className="text-sm text-slate-700">Hi, {user.name}</span>
                            <Button size="sm" variant="outline" onClick={handleLogout}>Log out</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login"><Button size="sm" variant="ghost">Log in</Button></Link>
                            <Link to="/register"><Button size="sm">Get Started</Button></Link>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500">
                &copy; {new Date().getFullYear()} CareConnect Live. All rights reserved.
            </footer>
        </div>
    );
};
