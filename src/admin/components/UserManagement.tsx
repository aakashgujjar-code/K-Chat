import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types';
import { formatRelativeTime } from '../../utils';

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredUsers(
                users.filter(u =>
                    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data as User[]);
            setFilteredUsers(data as User[]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (updatedUser: Partial<User>) => {
        if (!editingUser) return;

        try {
            const { error } = await supabase
                .from('users')
                .update(updatedUser)
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updatedUser } : u));
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            // First delete user's messages and chats (if not cascaded)
            // This is safer in case the DB doesn't have ON DELETE CASCADE
            await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
            await supabase.from('chats').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
            await supabase.from('status_updates').delete().eq('user_id', userId);
            await supabase.from('blocked_users').delete().or(`user_id.eq.${userId},blocked_user_id.eq.${userId}`);

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.filter(u => u.id !== userId));
            setDeleteConfirm(null);
            alert('User deleted successfully');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="text-gray-400">{users.length} total users</p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, username, or email..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Email</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Joined</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0EA5E9&color=fff`}
                                                alt={user.full_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-white">{user.full_name}</p>
                                                <p className="text-sm text-gray-400">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.is_online
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-gray-600/50 text-gray-400'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-400' : 'bg-gray-500'}`} />
                                            {user.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {formatRelativeTime(user.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                                    value={editingUser.username}
                                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Profile Visibility</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                                    value={editingUser.profile_visibility}
                                    onChange={(e) => setEditingUser({ ...editingUser, profile_visibility: e.target.value as 'public' | 'private' })}
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdateUser({
                                        full_name: editingUser.full_name,
                                        username: editingUser.username,
                                        profile_visibility: editingUser.profile_visibility,
                                    })}
                                    className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-2">Delete User?</h2>
                        <p className="text-gray-400 mb-4">This will permanently delete the user and all their data including chats and messages.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
