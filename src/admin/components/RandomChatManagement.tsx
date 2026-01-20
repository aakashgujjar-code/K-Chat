import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../utils';

interface RandomChatSession {
    id: string;
    user1: { full_name: string; username: string };
    user2: { full_name: string; username: string };
    status: string;
    created_at: string;
    ended_at: string | null;
    messageCount?: number;
}

export function RandomChatManagement() {
    const [sessions, setSessions] = useState<RandomChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('random_chat_sessions')
                .select(`
          *,
          user1:users!random_chat_sessions_user1_id_fkey(full_name, username),
          user2:users!random_chat_sessions_user2_id_fkey(full_name, username)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get message count for each session
            const sessionsWithCount = await Promise.all(
                (data || []).map(async (session) => {
                    const { count } = await supabase
                        .from('random_chat_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('session_id', session.id);

                    return { ...session, messageCount: count || 0 };
                })
            );

            setSessions(sessionsWithCount as RandomChatSession[]);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSessions = sessions.filter(s => {
        if (filter === 'active') return s.status === 'active';
        if (filter === 'ended') return s.status === 'disconnected';
        return true;
    });

    const getDuration = (start: string, end: string | null) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
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
                <h1 className="text-2xl font-bold text-white">Random Chat Sessions</h1>
                <p className="text-gray-400">{sessions.length} total sessions</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {(['all', 'active', 'ended'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg capitalize ${filter === f
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Sessions Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User 1</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User 2</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Duration</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Messages</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Started</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.map((session) => (
                                <tr key={session.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3 text-white">@{session.user1?.username}</td>
                                    <td className="px-4 py-3 text-white">@{session.user2?.username}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${session.status === 'active'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-600/50 text-gray-400'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                                            {session.status === 'active' ? 'Active' : 'Ended'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {getDuration(session.created_at, session.ended_at)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{session.messageCount}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {formatRelativeTime(session.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
