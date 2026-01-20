import { useNavigate } from 'react-router-dom';
import { User, Palette, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore, useThemeStore } from '../store';
import { EmptyChat } from '../components/chat/EmptyChat';

export function Settings() {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { mode, setMode } = useThemeStore();

    const handleLogout = async () => {
        await signOut();
        navigate('/signin');
    };

    const settingsItems = [
        {
            icon: User,
            label: 'Profile',
            description: 'Update your profile details',
            onClick: () => navigate('/settings/profile'),
        },
        {
            icon: Palette,
            label: 'Appearance',
            description: 'Themes & customization',
            onClick: () => navigate('/settings/appearance'),
        },
        {
            icon: Shield,
            label: 'Privacy',
            description: 'Control your privacy settings',
            onClick: () => navigate('/settings/privacy'),
        },
    ];

    return (
        <div className="flex w-full h-full">
            {/* Settings List */}
            <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                {/* Header */}
                <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {/* User Info */}
                    {user && (
                        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                            <img
                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0EA5E9&color=fff`}
                                alt={user.full_name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user.full_name}</h2>
                                <p className="text-gray-500">@{user.username}</p>
                            </div>
                        </div>
                    )}

                    {/* Settings List */}
                    <div className="p-4 space-y-2">
                        {settingsItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                                    <item.icon className="text-primary-500" size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                </div>
                                <ChevronRight className="text-gray-400" size={20} />
                            </button>
                        ))}
                    </div>

                    {/* Quick Theme Toggle */}
                    <div className="p-4">
                        <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="flex-1 font-medium text-gray-900 dark:text-white">Theme</span>
                            <div className="flex gap-2">
                                {(['light', 'dark', 'auto'] as const).map((themeMode) => (
                                    <button
                                        key={themeMode}
                                        onClick={() => setMode(themeMode)}
                                        className={`px-3 py-1 rounded-lg text-sm capitalize ${mode === themeMode
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {themeMode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="p-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side Placeholder */}
            <div className="hidden md:flex flex-1 bg-gray-50 dark:bg-gray-950">
                <EmptyChat />
            </div>
        </div>
    );
}
