import { useState, useEffect } from 'react';
import { Users, MessageCircle, CircleDot, Shuffle, TrendingUp, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
    totalUsers: number;
    activeToday: number;
    totalChats: number;
    messagesToday: number;
    activeStatuses: number;
    totalRandomChats: number;
    newSignupsToday: number;
}

export function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeToday: 0,
        totalChats: 0,
        messagesToday: 0,
        activeStatuses: 0,
        totalRandomChats: 0,
        newSignupsToday: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Total users
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Active today (users who are online or were last seen today)
            const { count: activeToday } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .or(`is_online.eq.true,last_seen.gte.${todayISO}`);

            // Total chats
            const { count: totalChats } = await supabase
                .from('chats')
                .select('*', { count: 'exact', head: true });

            // Messages today
            const { count: messagesToday } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayISO);

            // Active statuses (not expired)
            const { count: activeStatuses } = await supabase
                .from('statuses')
                .select('*', { count: 'exact', head: true })
                .gt('expires_at', new Date().toISOString());

            // Total random chat sessions
            const { count: totalRandomChats } = await supabase
                .from('random_chat_sessions')
                .select('*', { count: 'exact', head: true });

            // New signups today
            const { count: newSignupsToday } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayISO);

            setStats({
                totalUsers: totalUsers || 0,
                activeToday: activeToday || 0,
                totalChats: totalChats || 0,
                messagesToday: messagesToday || 0,
                activeStatuses: activeStatuses || 0,
                totalRandomChats: totalRandomChats || 0,
                newSignupsToday: newSignupsToday || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-primary-500' },
        { label: 'Active Today', value: stats.activeToday, icon: TrendingUp, color: 'bg-green-500' },
        { label: 'Total Chats', value: stats.totalChats, icon: MessageCircle, color: 'bg-purple-500' },
        { label: 'Messages Today', value: stats.messagesToday, icon: MessageCircle, color: 'bg-orange-500' },
        { label: 'Active Statuses', value: stats.activeStatuses, icon: CircleDot, color: 'bg-pink-500' },
        { label: 'Random Chats', value: stats.totalRandomChats, icon: Shuffle, color: 'bg-cyan-500' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Signups Today */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <UserPlus className="text-green-400" size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-white">New Signups Today</h2>
                </div>
                <p className="text-4xl font-bold text-green-400">{stats.newSignupsToday}</p>
                <p className="text-gray-400 text-sm mt-1">new users registered today</p>
            </div>
        </div>
    );
}
