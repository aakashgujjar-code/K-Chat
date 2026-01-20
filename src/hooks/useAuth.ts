import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export function useAuth() {
    const { user, settings, isLoading, isAuthenticated, setUser, setSettings, setLoading, signOut, refreshUser } = useAuthStore();

    useEffect(() => {
        // Initial session check
        refreshUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await refreshUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSettings(null);
                setLoading(false);
            }
        });

        // Cleanup
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Update online status on visibility change
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!user) return;

            const isOnline = document.visibilityState === 'visible';
            await supabase.from('users').update({
                is_online: isOnline,
                ...(isOnline ? {} : { last_seen: new Date().toISOString() })
            }).eq('id', user.id);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Update offline on page unload
        const handleBeforeUnload = () => {
            if (!user) return;
            navigator.sendBeacon && navigator.sendBeacon(
                `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
                JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
            );
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [user]);

    const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .ilike('username', username)
            .maybeSingle();

        return !data && !error;
    }, []);

    const updateProfile = useCallback(async (updates: Partial<User>): Promise<{ error?: string }> => {
        if (!user) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);

        if (error) return { error: error.message };

        setUser({ ...user, ...updates } as User);
        return {};
    }, [user, setUser]);

    return {
        user,
        settings,
        isLoading,
        isAuthenticated,
        signOut,
        refreshUser,
        checkUsernameAvailability,
        updateProfile,
    };
}
