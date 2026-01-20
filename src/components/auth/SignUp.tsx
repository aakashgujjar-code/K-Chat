import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { validateEmail, validatePassword, validateFullName, validateDateOfBirth, validateUsername } from '../../utils/validators';

type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

interface Step1Data {
    fullName: string;
    email: string;
    dateOfBirth: string;
    gender: Gender | '';
    password: string;
    confirmPassword: string;
}

interface Step2Data {
    username: string;
}

export function SignUp() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Step 1 data
    const [step1Data, setStep1Data] = useState<Step1Data>({
        fullName: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        password: '',
        confirmPassword: '',
    });

    // Step 2 data
    const [step2Data, setStep2Data] = useState<Step2Data>({ username: '' });
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    // Step 1 validation
    const [step1Errors, setStep1Errors] = useState<Partial<Record<keyof Step1Data, string>>>({});

    const validateStep1 = (): boolean => {
        const errors: Partial<Record<keyof Step1Data, string>> = {};

        const fullNameError = validateFullName(step1Data.fullName);
        if (fullNameError) errors.fullName = fullNameError;

        const emailError = validateEmail(step1Data.email);
        if (emailError) errors.email = emailError;

        const dobError = validateDateOfBirth(step1Data.dateOfBirth);
        if (dobError) errors.dateOfBirth = dobError;

        if (!step1Data.gender) errors.gender = 'Please select a gender';

        const passwordError = validatePassword(step1Data.password);
        if (passwordError) errors.password = passwordError;

        if (step1Data.password !== step1Data.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setStep1Errors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleStep1Next = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    // Username availability check
    const checkUsername = async (username: string) => {
        const error = validateUsername(username);
        if (error) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');

        const { data } = await supabase
            .from('users')
            .select('id')
            .ilike('username', username)
            .maybeSingle();

        setUsernameStatus(data ? 'taken' : 'available');
    };

    const handleUsernameChange = (value: string) => {
        setStep2Data({ username: value.toLowerCase().replace(/\s/g, '') });
        if (value.length >= 3) {
            // Debounce the check
            const timer = setTimeout(() => checkUsername(value), 500);
            return () => clearTimeout(timer);
        } else {
            setUsernameStatus('idle');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const usernameError = validateUsername(step2Data.username);
        if (usernameError) {
            setError(usernameError);
            return;
        }

        if (usernameStatus !== 'available') {
            setError('Please choose an available username');
            return;
        }

        setIsLoading(true);

        try {
            // Sign up with Supabase Auth - Metadata will be handled by DB trigger
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: step1Data.email,
                password: step1Data.password,
                options: {
                    data: {
                        full_name: step1Data.fullName,
                        username: step2Data.username,
                        date_of_birth: step1Data.dateOfBirth,
                        gender: step1Data.gender,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create account');

            // Redirect to home (Authentication trigger handles public.users creation)
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/favicon.svg" alt="K Chat Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-primary-500">K Chat</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Create your account</p>
                </div>

                {/* Card */}
                <div className="card p-6 animate-fade-in">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                        <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-center mb-4">Basic Information</h2>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className={`input ${step1Errors.fullName ? 'input-error' : ''}`}
                                    placeholder="John Doe"
                                    value={step1Data.fullName}
                                    onChange={(e) => setStep1Data({ ...step1Data, fullName: e.target.value })}
                                />
                                {step1Errors.fullName && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className={`input ${step1Errors.email ? 'input-error' : ''}`}
                                    placeholder="john@example.com"
                                    value={step1Data.email}
                                    onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                                />
                                {step1Errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.email}</p>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    className={`input ${step1Errors.dateOfBirth ? 'input-error' : ''}`}
                                    value={step1Data.dateOfBirth}
                                    onChange={(e) => setStep1Data({ ...step1Data, dateOfBirth: e.target.value })}
                                />
                                {step1Errors.dateOfBirth && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.dateOfBirth}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Gender
                                </label>
                                <select
                                    className={`input ${step1Errors.gender ? 'input-error' : ''}`}
                                    value={step1Data.gender}
                                    onChange={(e) => setStep1Data({ ...step1Data, gender: e.target.value as Gender })}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                                {step1Errors.gender && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.gender}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`input pr-10 ${step1Errors.password ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                        value={step1Data.password}
                                        onChange={(e) => setStep1Data({ ...step1Data, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {step1Errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    className={`input ${step1Errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    value={step1Data.confirmPassword}
                                    onChange={(e) => setStep1Data({ ...step1Data, confirmPassword: e.target.value })}
                                />
                                {step1Errors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{step1Errors.confirmPassword}</p>
                                )}
                            </div>

                            <button
                                type="button"
                                className="btn-primary w-full flex items-center justify-center gap-2"
                                onClick={handleStep1Next}
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Username */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="text-xl font-semibold text-center mb-4">Choose Username</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Username
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                    <input
                                        type="text"
                                        className="input pl-8 pr-10"
                                        placeholder="johndoe"
                                        value={step2Data.username}
                                        onChange={(e) => handleUsernameChange(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {usernameStatus === 'checking' && (
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                        )}
                                        {usernameStatus === 'available' && (
                                            <Check className="w-5 h-5 text-green-500" />
                                        )}
                                        {usernameStatus === 'taken' && (
                                            <X className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">
                                    3-20 characters, letters, numbers, and underscores only
                                </p>
                                {usernameStatus === 'available' && (
                                    <p className="text-green-500 text-xs mt-1">Username is available!</p>
                                )}
                                {usernameStatus === 'taken' && (
                                    <p className="text-red-500 text-xs mt-1">Username is already taken</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="btn-secondary flex-1"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    disabled={isLoading || usernameStatus !== 'available'}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
                        Already have an account?{' '}
                        <Link to="/signin" className="text-primary-500 hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
