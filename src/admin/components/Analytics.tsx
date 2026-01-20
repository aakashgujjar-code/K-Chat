import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DailyStats {
    date: string;
    new_users: number;
    messages: number;
    active_users: number;
}

export function Analytics() {
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<7 | 30 | 90>(7);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - dateRange);

            const dailyStats: DailyStats[] = [];

            // Generate stats for each day
            for (let i = 0; i < dateRange; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const dateStr = date.toISOString().split('T')[0];
                const startISO = date.toISOString();
                const endISO = nextDate.toISOString();

                // New users
                const { count: newUsers } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startISO)
                    .lt('created_at', endISO);

                // Messages
                const { count: messages } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startISO)
                    .lt('created_at', endISO);

                // Active users (approximation)
                const { count: activeUsers } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .gte('last_seen', startISO)
                    .lt('last_seen', endISO);

                dailyStats.push({
                    date: dateStr,
                    new_users: newUsers || 0,
                    messages: messages || 0,
                    active_users: activeUsers || 0,
                });
            }

            setStats(dailyStats);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const maxMessages = Math.max(...stats.map(s => s.messages), 1);
    const maxUsers = Math.max(...stats.map(s => s.new_users), 1);

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
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <div className="flex gap-2">
                    {([7, 30, 90] as const).map((days) => (
                        <button
                            key={days}
                            onClick={() => setDateRange(days)}
                            className={`px-4 py-2 rounded-lg ${dateRange === days
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {days} days
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Messages per Day</h2>
                <div className="h-48 flex items-end gap-1">
                    {stats.map((day) => (
                        <div
                            key={day.date}
                            className="flex-1 bg-primary-500/80 hover:bg-primary-500 rounded-t transition-colors"
                            style={{ height: `${(day.messages / maxMessages) * 100}%`, minHeight: '4px' }}
                            title={`${day.date}: ${day.messages} messages`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{stats[0]?.date}</span>
                    <span>{stats[stats.length - 1]?.date}</span>
                </div>
            </div>

            {/* New Users Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">New Users per Day</h2>
                <div className="h-48 flex items-end gap-1">
                    {stats.map((day) => (
                        <div
                            key={day.date}
                            className="flex-1 bg-green-500/80 hover:bg-green-500 rounded-t transition-colors"
                            style={{ height: `${(day.new_users / maxUsers) * 100}%`, minHeight: '4px' }}
                            title={`${day.date}: ${day.new_users} new users`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{stats[0]?.date}</span>
                    <span>{stats[stats.length - 1]?.date}</span>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Date</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">New Users</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Messages</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Active Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.slice().reverse().slice(0, 10).map((day) => (
                                <tr key={day.date} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3 text-white">{day.date}</td>
                                    <td className="px-4 py-3 text-green-400">{day.new_users}</td>
                                    <td className="px-4 py-3 text-primary-400">{day.messages}</td>
                                    <td className="px-4 py-3 text-gray-300">{day.active_users}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
