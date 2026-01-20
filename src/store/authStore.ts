import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
    user: User | null;
    settings: UserSettings | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setSettings: (settings: UserSettings | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            settings: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setSettings: (settings) => set({ settings }),
            setLoading: (isLoading) => set({ isLoading }),

            signOut: async () => {
                // Update online status before signing out
                const { user } = get();
                if (user) {
                    await supabase.from('users').update({
                        is_online: false,
                        last_seen: new Date().toISOString()
                    } as any).eq('id', user.id);
                }

                await supabase.auth.signOut();
                set({ user: null, settings: null, isAuthenticated: false });
            },

            refreshUser: async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session?.user) {
                        set({ user: null, settings: null, isAuthenticated: false, isLoading: false });
                        return;
                    }

                    // Fetch user profile
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (userError || !userData) {
                        set({ user: null, settings: null, isAuthenticated: false, isLoading: false });
                        return;
                    }

                    // Fetch user settings
                    const { data: settingsData } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();

                    // Update online status
                    await supabase.from('users').update({ is_online: true } as any).eq('id', session.user.id);

                    set({
                        user: userData as unknown as User,
                        settings: settingsData ? (settingsData as unknown as UserSettings) : null,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Error refreshing user:', error);
                    set({ user: null, settings: null, isAuthenticated: false, isLoading: false });
                }
            },
        }),
        {
            name: 'k-chat-auth',
            partialize: (state) => ({ user: state.user, settings: state.settings }),
        }
    )
);
