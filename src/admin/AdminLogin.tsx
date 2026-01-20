import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminLogin() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        checkAdminExists();
    }, []);

    const checkAdminExists = async () => {
        const { data, error } = await supabase
            .from('admins')
            .select('id')
            .limit(1);

        setIsFirstTime(!error && (!data || data.length === 0));
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            // Hash password on client (in production, use server-side hashing)
            const passwordHash = btoa(formData.password); // Simple encoding for demo

            const { error } = await supabase.from('admins').insert({
                email: formData.email,
                password_hash: passwordHash,
            });

            if (error) throw error;

            // Store admin session
            localStorage.setItem('adminAuth', JSON.stringify({ email: formData.email }));
            navigate('/1234/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create admin account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const passwordHash = btoa(formData.password);

            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('email', formData.email)
                .eq('password_hash', passwordHash)
                .single();

            if (error || !data) {
                throw new Error('Invalid email or password');
            }

            // Store admin session
            localStorage.setItem('adminAuth', JSON.stringify({ email: data.email, id: data.id }));
            navigate('/1234/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const [showForgotPassword, setShowForgotPassword] = useState(false);

    if (isFirstTime === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    const handleResetAdmin = async () => {
        if (!confirm('CRITICAL: This will delete the existing admin account so you can sign up again. Are you sure?')) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.from('admins').delete().neq('email', 'placeholder_to_match_all');
            if (error) throw error;

            alert('Admin settings reset successfully. You can now create a new admin account.');
            setIsFirstTime(true);
            localStorage.removeItem('adminAuth');
        } catch (err: any) {
            setError(err.message || 'Failed to reset admin account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/1234/admin/reset-password`, // Placeholder redirect
            });

            if (error) throw error;
            alert('Password reset email sent! Check your inbox.');
            setShowForgotPassword(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-xl overflow-hidden">
                        <img src="/favicon.svg" alt="K Chat Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">K Chat Admin</h1>
                    <p className="text-gray-400 mt-2">
                        {isFirstTime
                            ? 'Create your admin account'
                            : showForgotPassword
                                ? 'Reset your password'
                                : 'Sign in to admin panel'
                        }
                    </p>
                </div>

                {/* Card */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    {error && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {showForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="w-full text-sm text-gray-400 hover:text-white"
                            >
                                Back to Login
                            </button>
                            <div className="pt-4 mt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleResetAdmin}
                                    className="w-full text-xs text-red-500 hover:text-red-400 opacity-50 hover:opacity-100"
                                >
                                    Emergency Reset Admin System
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={isFirstTime ? handleCreateAdmin : handleLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 pr-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {!isFirstTime && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs text-primary-400 hover:text-primary-300"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password (only for first-time setup) */}
                            {isFirstTime && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isFirstTime ? (
                                    'Create Admin Account'
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                            {!isFirstTime && (
                                <div className="pt-4 mt-2 border-t border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={handleResetAdmin}
                                        className="w-full text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest font-semibold"
                                    >
                                        Emergency Reset
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
