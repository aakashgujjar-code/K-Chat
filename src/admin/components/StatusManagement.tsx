import { useState, useEffect } from 'react';
import { Eye, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../utils';

interface StatusWithUser {
    id: string;
    user_id: string;
    content: string;
    visibility: string;
    view_count: number;
    expires_at: string;
    created_at: string;
    user: { full_name: string; username: string };
}

interface StatusViewer {
    id: string;
    viewer: { full_name: string; username: string };
    viewed_at: string;
}

export function StatusManagement() {
    const [statuses, setStatuses] = useState<StatusWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<StatusWithUser | null>(null);
    const [viewers, setViewers] = useState<StatusViewer[]>([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            const { data, error } = await supabase
                .from('statuses')
                .select(`*, user:users(full_name, username)`)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStatuses(data as StatusWithUser[]);
        } catch (error) {
            console.error('Error fetching statuses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const viewStatusDetails = async (status: StatusWithUser) => {
        setSelectedStatus(status);
        setLoadingViewers(true);

        try {
            const { data, error } = await supabase
                .from('status_views')
                .select(`*, viewer:users!status_views_viewer_id_fkey(full_name, username)`)
                .eq('status_id', status.id)
                .order('viewed_at', { ascending: false });

            if (error) throw error;
            setViewers(data as StatusViewer[]);
        } catch (error) {
            console.error('Error fetching viewers:', error);
        } finally {
            setLoadingViewers(false);
        }
    };

    const handleDeleteStatus = async (statusId: string) => {
        try {
            const { error } = await supabase
                .from('statuses')
                .delete()
                .eq('id', statusId);

            if (error) throw error;

            setStatuses(statuses.filter(s => s.id !== statusId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting status:', error);
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
                <h1 className="text-2xl font-bold text-white">Active Statuses</h1>
                <p className="text-gray-400">{statuses.length} active</p>
            </div>

            {/* Statuses Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Content</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Views</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Posted</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statuses.map((status) => (
                                <tr key={status.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-white">@{status.user?.username}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                                        {status.content}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{status.view_count}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {formatRelativeTime(status.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewStatusDetails(status)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(status.id)}
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

            {/* Status Details Modal */}
            {selectedStatus && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white">Status Details</h2>
                            <button onClick={() => setSelectedStatus(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Posted by @{selectedStatus.user?.username}</p>
                                <p className="text-white">{selectedStatus.content}</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Visibility: {selectedStatus.visibility} • Views: {selectedStatus.view_count}
                                </p>
                            </div>

                            <h3 className="text-sm font-medium text-gray-300 mb-2">Viewed by:</h3>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {loadingViewers ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                    </div>
                                ) : viewers.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No viewers yet</p>
                                ) : (
                                    viewers.map((v) => (
                                        <div key={v.id} className="flex items-center justify-between py-1">
                                            <span className="text-gray-300">@{v.viewer?.username}</span>
                                            <span className="text-gray-500 text-sm">{formatRelativeTime(v.viewed_at)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-2">Delete Status?</h2>
                        <p className="text-gray-400 mb-4">This status will be permanently deleted.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteStatus(deleteConfirm)}
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
