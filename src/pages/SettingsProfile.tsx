import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { validateFullName, validateUsername } from '../utils/validators';

export function SettingsProfile() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuthStore();

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setUsername(user.username);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!user) return;

        // Validation
        const nameError = validateFullName(fullName);
        if (nameError) {
            setMessage({ type: 'error', text: nameError });
            return;
        }

        const usernameError = validateUsername(username);
        if (usernameError) {
            setMessage({ type: 'error', text: usernameError });
            return;
        }

        setIsLoading(true);

        try {
            // Check if username is taken (if changed)
            if (username !== user.username) {
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .ilike('username', username)
                    .neq('id', user.id)
                    .maybeSingle();

                if (existing) {
                    throw new Error('Username is already taken');
                }
            }

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    username: username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            // Update User Profile
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    profile_picture_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshUser();
            setMessage({ type: 'success', text: 'Profile picture updated' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload image' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-1 -ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
            </header>

            <div className="p-6 max-w-lg mx-auto">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <img
                            src={user?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=0EA5E9&color=fff`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800"
                        />
                        <label className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl text-sm ${message.type === 'success'
                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="input"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                                className="input pl-8"
                                placeholder="username"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Unique handle for people to find you
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !user}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
