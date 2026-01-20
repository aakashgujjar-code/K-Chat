import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MessageCircle,
    CircleDot,
    Shuffle,
    LogOut,
    Menu,
    X,
    BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const navItems = [
    { path: '/1234/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/1234/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/1234/admin/users', icon: Users, label: 'Users' },
    { path: '/1234/admin/chats', icon: MessageCircle, label: 'Chats' },
    { path: '/1234/admin/statuses', icon: CircleDot, label: 'Statuses' },
    { path: '/1234/admin/random-chats', icon: Shuffle, label: 'Random Chats' },
];

export function AdminLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');

    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) {
            navigate('/1234/admin');
            return;
        }
        const { email, avatar_url } = JSON.parse(adminAuth);
        setAdminEmail(email);
        if (avatar_url) setAdminAvatar(avatar_url);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        navigate('/1234/admin');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `admin-avatar-${Date.now()}.${fileExt}`;
            const filePath = `admin-avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            // Update Local Storage (and ideally DB if admin table has avatar_url)
            const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
            const newAuth = { ...adminAuth, avatar_url: publicUrl };
            localStorage.setItem('adminAuth', JSON.stringify(newAuth));

            setAdminAvatar(publicUrl);

            // Try to update DB if id exists
            if (adminAuth.id) {
                await supabase
                    .from('admins')
                    .update({ avatar_url: publicUrl } as any) // Cast to any in case type missing
                    .eq('id', adminAuth.id);
            }

        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-800 border-r border-gray-700
        transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                            <img src="/favicon.svg" alt="K Chat" className="w-8 h-8" />
                            <h1 className="text-xl font-bold text-white">K Chat Admin</h1>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden text-gray-400"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                  transition-colors duration-200
                  ${isActive
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }
                `}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Admin Info & Logout */}
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('admin-avatar-upload')?.click()}>
                                <img
                                    src={adminAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminEmail)}&background=0EA5E9&color=fff`}
                                    alt="Admin"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-primary-500 transition-colors"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs">Edit</span>
                                </div>
                                <input
                                    type="file"
                                    id="admin-avatar-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Admin</p>
                                <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center gap-4 px-4 h-16 bg-gray-800 border-b border-gray-700">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-400"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/favicon.svg" alt="K Chat" className="w-8 h-8" />
                        <h1 className="text-lg font-semibold text-white">K Chat Admin</h1>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
