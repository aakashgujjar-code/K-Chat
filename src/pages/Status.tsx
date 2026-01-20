import { useState, useEffect } from 'react';
import { Plus, Clock, Eye, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { formatRelativeTime } from '../utils';
import type { Status, User } from '../types';
import { EmptyChat } from '../components/chat/EmptyChat';

interface StatusWithUser extends Status {
    user: User;
    background_color?: string;
}

const STATUS_COLORS = [
    { id: 'blue', value: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'Blue' },
    { id: 'green', value: 'bg-gradient-to-br from-green-500 to-green-600', label: 'Green' },
    { id: 'purple', value: 'bg-gradient-to-br from-purple-500 to-purple-600', label: 'Purple' },
    { id: 'orange', value: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'Orange' },
    { id: 'pink', value: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'Pink' },
    { id: 'gray', value: 'bg-gray-700', label: 'Classic' },
];

export function StatusPage() {
    const { user, settings } = useAuthStore();
    const [myStatuses, setMyStatuses] = useState<Status[]>([]);
    const [othersStatuses, setOthersStatuses] = useState<StatusWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create State
    const [newStatusContent, setNewStatusContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0].value);
    const [statusVisibility, setStatusVisibility] = useState<'everyone' | 'chatlist'>('everyone');
    const [isCreating, setIsCreating] = useState(false);

    // Viewer State
    const [viewingStatus, setViewingStatus] = useState<StatusWithUser | Status | null>(null);
    const [viewProgress, setViewProgress] = useState(0);
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState<{ viewer: User, viewed_at: string }[]>([]);

    useEffect(() => {
        if (settings?.status_visibility && settings.status_visibility !== 'nobody') {
            setStatusVisibility(settings.status_visibility as any);
        }
    }, [settings]);

    useEffect(() => {
        fetchStatuses();
    }, [user]);

    // Timer for status viewer
    useEffect(() => {
        let interval: any;
        if (viewingStatus && !showViewers) {
            setViewProgress(0);
            interval = setInterval(() => {
                setViewProgress(prev => {
                    if (prev >= 100) {
                        setViewingStatus(null);
                        return 100;
                    }
                    return prev + 1; // Slower: 100 ticks * 100ms = 10s
                });
            }, 50); // 50ms interval, +1% = 5000ms (5s). Let's make it 5s.
        }
        return () => clearInterval(interval);
    }, [viewingStatus, showViewers]);

    const fetchStatuses = async () => {
        if (!user) return;

        try {
            // Fetch my statuses
            const { data: myData } = await supabase
                .from('statuses')
                .select('*')
                .eq('user_id', user.id)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            setMyStatuses(myData || []);

            // Fetch chat contacts
            let contactIds = new Set<string>();
            const { data: chats } = await supabase
                .from('chats')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

            if (chats) {
                chats.forEach(c => {
                    if (c.user1_id !== user.id) contactIds.add(c.user1_id);
                    if (c.user2_id !== user.id) contactIds.add(c.user2_id);
                });
            }

            // Fetch others
            const { data: othersData } = await supabase
                .from('statuses')
                .select(`*, user:users(*)`)
                .neq('user_id', user.id)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            const filteredOthers = (othersData || []).filter((status: any) => {
                if (status.visibility === 'everyone') return true;
                if (status.visibility === 'chatlist') {
                    return contactIds.has(status.user_id);
                }
                return false;
            });

            setOthersStatuses(filteredOthers as StatusWithUser[]);
        } catch (error) {
            console.error('Error fetching statuses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createStatus = async () => {
        if (!newStatusContent.trim() || !user) return;

        setIsCreating(true);
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const { error } = await supabase.from('statuses').insert({
                user_id: user.id,
                content: newStatusContent,
                visibility: statusVisibility,
                expires_at: expiresAt.toISOString(),
                background_color: selectedColor // NEW
            });

            if (error) throw error;

            setNewStatusContent('');
            setSelectedColor(STATUS_COLORS[0].value);
            setShowCreateModal(false);
            fetchStatuses();
        } catch (error) {
            console.error('Error creating status:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteStatus = async (statusId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this status?')) return;

        try {
            const { error } = await supabase
                .from('statuses')
                .delete()
                .eq('id', statusId);

            if (error) throw error;
            setMyStatuses(prev => prev.filter(s => s.id !== statusId));
        } catch (error) {
            console.error('Error deleting status:', error);
        }
    };

    const recordView = async (status: StatusWithUser | Status) => {
        setViewingStatus(status);
        setShowViewers(false);
        setViewersList([]); // Reset

        if (!user || status.user_id === user.id) {
            // If my status, fetch viewers immediately
            if (status.user_id === user?.id) fetchViewers(status.id);
            return;
        }

        try {
            await supabase.from('status_views').insert({
                status_id: status.id,
                viewer_id: user.id,
            });
        } catch (error) {
            // Ignore duplicates
        }
    };

    const fetchViewers = async (statusId: string) => {
        try {
            const { data } = await supabase
                .from('status_views')
                .select(`
                    viewed_at,
                    viewer:users(*)
                `)
                .eq('status_id', statusId)
                .order('viewed_at', { ascending: false });

            if (data) {
                setViewersList(data.map((d: any) => ({
                    viewer: d.viewer,
                    viewed_at: d.viewed_at
                })));
            }
        } catch (e) {
            console.error("Error fetching viewers", e);
        }
    };

    return (
        <div className="flex w-full h-full relative">
            {/* Left List Panel */}
            <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Status</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* My Status */}
                            <section>
                                <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">My Status</h2>
                                {myStatuses.length > 0 ? (
                                    <div className="space-y-3">
                                        {myStatuses.map((status: any) => (
                                            <div key={status.id} className="group relative p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => recordView(status)}>
                                                {/* Mini Preview of color */}
                                                <div className={`w-full h-12 rounded-lg mb-2 ${status.background_color || 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center overflow-hidden`}>
                                                    <p className="text-white text-xs px-2 line-clamp-1">{status.content}</p>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {formatRelativeTime(status.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={14} />
                                                        {status.view_count} views
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteStatus(status.id, e)}
                                                    className="absolute top-2 right-2 p-2 text-white bg-black/20 hover:bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">Add a status</p>
                                            <p className="text-sm text-gray-500">Share what's on your mind</p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Others' Statuses */}
                            <section>
                                <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">Recent Updates</h2>
                                {othersStatuses.length > 0 ? (
                                    <div className="space-y-3">
                                        {othersStatuses.map((status: any) => (
                                            <div
                                                key={status.id}
                                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => recordView(status)}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`p-[2px] rounded-full ${status.background_color ? 'bg-gradient-to-tr from-primary-400 to-primary-600' : 'bg-gray-200'}`}>
                                                        <img
                                                            src={status.user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(status.user.full_name)}&background=0EA5E9&color=fff`}
                                                            alt={status.user.full_name}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{status.user.full_name}</p>
                                                        <p className="text-xs text-gray-500">{formatRelativeTime(status.created_at)}</p>
                                                    </div>
                                                </div>
                                                {/* Mini Preview */}
                                                <div className={`w-full h-12 rounded-lg mb-2 ${status.background_color || 'bg-gray-700'} flex items-center justify-center overflow-hidden`}>
                                                    <p className="text-white text-xs px-2 line-clamp-1">{status.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No status updates yet
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Placeholder (Desktop) */}
            <div className="hidden md:flex flex-1 bg-gray-50 dark:bg-gray-950">
                <EmptyChat />
            </div>

            {/* Create Status Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="font-semibold text-lg">Create Status</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            {/* Color Picker */}
                            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {STATUS_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedColor(c.value)}
                                        className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${selectedColor === c.value ? 'border-primary-500 scale-110' : 'border-transparent'} ${c.value}`}
                                        title={c.label}
                                    />
                                ))}
                            </div>

                            <div className={`w-full h-64 rounded-xl flex items-center justify-center p-6 text-center shadow-inner mb-4 transition-all duration-300 ${selectedColor}`}>
                                <textarea
                                    placeholder="Type a status..."
                                    className="w-full h-full bg-transparent border-none text-white text-2xl font-medium text-center placeholder-white/50 focus:ring-0 resize-none font-sans"
                                    maxLength={500}
                                    value={newStatusContent}
                                    onChange={(e) => setNewStatusContent(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span>{newStatusContent.length}/500</span>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Share with:</p>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={statusVisibility === 'everyone'}
                                            onChange={() => setStatusVisibility('everyone')}
                                            className="text-primary-500"
                                        />
                                        <span>Everyone</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={statusVisibility === 'chatlist'}
                                            onChange={() => setStatusVisibility('chatlist')}
                                            className="text-primary-500"
                                        />
                                        <span>Contacts</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createStatus}
                                    disabled={!newStatusContent.trim() || isCreating}
                                    className="btn-primary flex-1"
                                >
                                    {isCreating ? 'Posting...' : 'Post Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Status Full Screen Overlay */}
            {viewingStatus && (
                <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center ${(viewingStatus as any).background_color || 'bg-gray-900'}`}>
                    {/* Viewers Overlay (If active) */}
                    {showViewers && (
                        <div className="absolute inset-0 bg-black/80 z-[70] flex flex-col pt-20 px-4 pb-10">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                <Eye size={20} />
                                Viewers ({viewersList.length})
                            </h3>
                            <div className="flex-1 overflow-y-auto">
                                {viewersList.length === 0 ? (
                                    <p className="text-gray-400">No views yet.</p>
                                ) : (
                                    viewersList.map((v, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border-b border-white/10">
                                            <img
                                                src={v.viewer.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.viewer.full_name)}`}
                                                className="w-10 h-10 rounded-full"
                                                alt={v.viewer.full_name}
                                            />
                                            <div>
                                                <p className="text-white font-medium">{v.viewer.full_name}</p>
                                                <p className="text-xs text-gray-400">{formatRelativeTime(v.viewed_at)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => setShowViewers(false)}
                                className="mt-4 p-3 bg-white text-black rounded-xl font-bold"
                            >
                                Close Viewers
                            </button>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
                        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75 ease-linear"
                                style={{ width: `${viewProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Navbar */}
                    <div className="absolute top-8 left-0 right-0 p-4 flex items-center justify-between z-50 text-white">
                        <div className="flex items-center gap-3">
                            {/* Show user details */}
                            {'user' in viewingStatus ? (
                                <>
                                    <img
                                        src={(viewingStatus as StatusWithUser).user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((viewingStatus as StatusWithUser).user.full_name)}&background=0EA5E9&color=fff`}
                                        alt=""
                                        className="w-10 h-10 rounded-full border-2 border-white"
                                    />
                                    <div>
                                        <p className="font-semibold drop-shadow-md">{(viewingStatus as StatusWithUser).user.full_name}</p>
                                        <p className="text-xs opacity-75 drop-shadow-md">{formatRelativeTime(viewingStatus.created_at)}</p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="font-semibold drop-shadow-md">My Status</p>
                                    <p className="text-xs opacity-75 drop-shadow-md">{formatRelativeTime(viewingStatus.created_at)}</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setViewingStatus(null)} className="p-2 hover:bg-white/10 rounded-full drop-shadow-md">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="w-full max-w-2xl px-6 text-center z-10">
                        <p className="text-2xl md:text-5xl font-bold text-white leading-relaxed drop-shadow-lg">
                            {viewingStatus.content}
                        </p>
                    </div>

                    {/* Footer / Owner Controls */}
                    {user && viewingStatus.user_id === user.id && (
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50">
                            <button
                                onClick={() => setShowViewers(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                            >
                                <Eye size={20} />
                                <span>{viewingStatus.view_count} Views</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
