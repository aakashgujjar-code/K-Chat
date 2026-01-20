import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';

export function SettingsPrivacy() {
    const navigate = useNavigate();
    const { user, settings, setSettings } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [visibility, setVisibility] = useState<'everyone' | 'chatlist' | 'nobody'>(
        (settings?.status_visibility as any) || 'everyone'
    );

    const handleSave = async (newVisibility: 'everyone' | 'chatlist' | 'nobody') => {
        if (!user || isLoading) return;
        setVisibility(newVisibility);
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('user_settings')
                .update({
                    status_visibility: newVisibility,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            if (settings) {
                setSettings({ ...settings, status_visibility: newVisibility });
            }
        } catch (error) {
            console.error('Error updating privacy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full bg-white dark:bg-gray-900 overflow-y-auto">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-1 -ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full md:hidden"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Privacy</h1>
            </header>

            <div className="p-4 max-w-2xl mx-auto space-y-8">
                <section>
                    <div className="flex items-center gap-2 mb-4 text-primary-500">
                        <Lock size={20} />
                        <h2 className="font-semibold">Status Privacy</h2>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                        Who can see my status updates
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        {[
                            { id: 'everyone', label: 'Everyone', desc: 'All users can see your status' },
                            { id: 'chatlist', label: 'My Contracts', desc: 'Only people you have chatted with' },
                            { id: 'nobody', label: 'Nobody', desc: 'No one can see your status' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleSave(option.id as any)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-0 border-gray-200 dark:border-gray-700 group"
                            >
                                <div className="flex-1 text-left">
                                    <p className={`font-medium ${visibility === option.id ? 'text-primary-500' : 'text-gray-900 dark:text-white'}`}>
                                        {option.label}
                                    </p>
                                    <p className="text-sm text-gray-500">{option.desc}</p>
                                </div>
                                {visibility === option.id && (
                                    <div className="text-primary-500 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full">
                                        <Check size={20} className="animate-scale-in" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-primary-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Saving...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
