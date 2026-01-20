import { MessageCircle, Search, CircleDot, Settings, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

const navItems = [
    { path: '/', icon: MessageCircle, label: 'Chats' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/status', icon: CircleDot, label: 'Status' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Hide navigation on auth pages
    if (['/signin', '/signup', '/forgot-password'].includes(location.pathname)) {
        return null;
    }

    const isChatPage = location.pathname.startsWith('/chat/');

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`
        hidden md:flex flex-col h-full
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img src="/favicon.svg" alt="K Chat" className="w-8 h-8 flex-shrink-0" />
                        {isSidebarOpen && (
                            <h1 className="text-xl font-bold text-primary-500 whitespace-nowrap">K Chat</h1>
                        )}
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto"
                        >
                            <X size={20} />
                        </button>
                    )}
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mx-auto"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 mx-2 rounded-xl
                transition-colors duration-200
                ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
              `}
                        >
                            <item.icon size={24} className="flex-shrink-0" />
                            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                {user && (
                    <div className="relative border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className={`
                                w-full p-4 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                                ${!isSidebarOpen && 'justify-center'}
                            `}
                        >
                            <img
                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0EA5E9&color=fff`}
                                alt={user.full_name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                            {isSidebarOpen && (
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="font-medium text-sm truncate text-gray-900 dark:text-white">{user.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                </div>
                            )}
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                                <div className={`
                                    absolute bottom-full left-4 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animation-scale-in
                                    ${!isSidebarOpen && 'left-16'}
                                `}>
                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate('/settings/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm text-gray-700 dark:text-gray-200"
                                    >
                                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                            <Settings size={16} />
                                        </div>
                                        View My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            signOut();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-sm text-red-600 dark:text-red-400"
                                    >
                                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                                            <LogOut size={16} />
                                        </div>
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </aside>

            {/* Mobile Bottom Navigation */}
            {!isChatPage && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
                    <div className="flex items-center justify-around py-2 px-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                    nav-item flex-1 ${isActive && 'nav-item-active'}
                  `}
                            >
                                <item.icon size={24} />
                                <span className="text-xs">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </>
    );
}
