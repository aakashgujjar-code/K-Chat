import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';

export const THEME_COLORS = {
    blue: {
        name: 'Blue',
        colors: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
            800: '#075985',
            900: '#0C4A6E',
        }
    },
    green: {
        name: 'Green',
        colors: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
        }
    },
    purple: {
        name: 'Purple',
        colors: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            200: '#DDD6FE',
            300: '#C4B5FD',
            400: '#A78BFA',
            500: '#8B5CF6',
            600: '#7C3AED',
            700: '#6D28D9',
            800: '#5B21B6',
            900: '#4C1D95',
        }
    },
    orange: {
        name: 'Orange',
        colors: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
        }
    }
};

interface ThemeState {
    mode: ThemeMode;
    colorTheme: string;
    bubbleStyle: 'rounded' | 'sharp';
    fontSize: 'small' | 'medium' | 'large';
    setMode: (mode: ThemeMode) => void;
    setColorTheme: (color: string) => void;
    setBubbleStyle: (style: 'rounded' | 'sharp') => void;
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'auto',
            colorTheme: 'blue',
            bubbleStyle: 'rounded',
            fontSize: 'medium',

            setMode: (mode) => {
                set({ mode });
                get().applyTheme();
            },

            setColorTheme: (colorTheme) => {
                set({ colorTheme });
                get().applyTheme();
            },

            setBubbleStyle: (bubbleStyle) => set({ bubbleStyle }),
            setFontSize: (fontSize) => set({ fontSize }),

            applyTheme: () => {
                const { mode, colorTheme } = get();
                const root = document.documentElement;

                // Apply Dark Mode
                if (mode === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.toggle('dark', prefersDark);
                } else {
                    root.classList.toggle('dark', mode === 'dark');
                }

                // Apply Color Theme
                const theme = THEME_COLORS[colorTheme as keyof typeof THEME_COLORS] || THEME_COLORS.blue;

                // Base Colors
                root.style.setProperty('--primary', theme.colors[500]); // Main Brand Color
                root.style.setProperty('--primary-foreground', '#ffffff');

                // Detailed Shades
                root.style.setProperty('--color-primary', theme.colors[500]);
                root.style.setProperty('--color-primary-50', theme.colors[50]);
                root.style.setProperty('--color-primary-100', theme.colors[100]);
                root.style.setProperty('--color-primary-200', theme.colors[200]);
                root.style.setProperty('--color-primary-300', theme.colors[300]);
                root.style.setProperty('--color-primary-400', theme.colors[400]);
                root.style.setProperty('--color-primary-500', theme.colors[500]);
                root.style.setProperty('--color-primary-600', theme.colors[600]);
                root.style.setProperty('--color-primary-700', theme.colors[700]);
                root.style.setProperty('--color-primary-800', theme.colors[800]);
                root.style.setProperty('--color-primary-900', theme.colors[900]);

                // Mode Dependent Colors (Backgrounds & Text)
                const isDark = root.classList.contains('dark');

                if (isDark) {
                    root.style.setProperty('--bg', '#111827'); // gray-900
                    root.style.setProperty('--bg-secondary', '#1f2937'); // gray-800
                    root.style.setProperty('--text', '#F9FAFB'); // gray-50
                    root.style.setProperty('--text-secondary', '#9CA3AF'); // gray-400
                    root.style.setProperty('--border', '#374151'); // gray-700
                    root.style.setProperty('--input-bg', '#1f2937');
                } else {
                    root.style.setProperty('--bg', '#FFFFFF'); // white
                    root.style.setProperty('--bg-secondary', '#F9FAFB'); // gray-50
                    root.style.setProperty('--text', '#111827'); // gray-900
                    root.style.setProperty('--text-secondary', '#6B7280'); // gray-500
                    root.style.setProperty('--border', '#E5E7EB'); // gray-200
                    root.style.setProperty('--input-bg', '#FFFFFF');
                }
            },
        }),
        {
            name: 'k-chat-theme',
        }
    )
);
