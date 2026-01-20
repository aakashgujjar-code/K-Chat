import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store';

export function SettingsAppearance() {
    const navigate = useNavigate();
    const { mode, setMode, colorTheme, setColorTheme } = useThemeStore();

    const colors = [
        { id: 'blue', name: 'Blue', bg: 'bg-sky-500' },
        { id: 'green', name: 'Green', bg: 'bg-green-500' },
        { id: 'purple', name: 'Purple', bg: 'bg-violet-500' },
        { id: 'orange', name: 'Orange', bg: 'bg-orange-500' },
    ];

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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h1>
            </header>

            <div className="p-4 space-y-8 max-w-2xl mx-auto">
                {/* Theme Mode */}
                <section>
                    <h2 className="text-sm font-medium text-gray-500 mb-3 px-1 uppercase tracking-wider">Mode</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        {[
                            { id: 'light', icon: Sun, label: 'Light', color: 'text-orange-500' },
                            { id: 'dark', icon: Moon, label: 'Dark', color: 'text-indigo-500' },
                            { id: 'auto', icon: Monitor, label: 'System', color: 'text-gray-500' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setMode(item.id as any)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={item.color} size={24} />
                                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${mode === item.id ? 'border-primary-500' : 'border-gray-400 dark:border-gray-600'}`}>
                                    {mode === item.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Color Theme */}
                <section>
                    <h2 className="text-sm font-medium text-gray-500 mb-3 px-1 uppercase tracking-wider">Accent Color</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {colors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => setColorTheme(color.id)}
                                className={`
                                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                    ${colorTheme === color.id
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                    }
                                `}
                            >
                                <div className={`w-12 h-12 rounded-full ${color.bg} shadow-sm flex items-center justify-center text-white`}>
                                    {colorTheme === color.id && <div className="w-4 h-4 bg-white rounded-full" />}
                                </div>
                                <span className={`text-sm font-medium ${colorTheme === color.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {color.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
