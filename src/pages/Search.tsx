import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Shuffle, Loader2, MessageCircle, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import type { User } from '../types';
import { EmptyChat } from '../components/chat/EmptyChat';

export function Search() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery);
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .neq('id', user?.id)
                .limit(20);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const startChat = async (otherUser: User) => {
        if (!user) return;

        try {
            // Get or create chat
            const { data: chatId, error } = await supabase
                .rpc('get_or_create_chat', { user1: user.id, user2: otherUser.id });

            if (error) throw error;

            navigate(`/chat/${chatId}`, { state: { otherUserId: otherUser.id } });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    return (
        <div className="flex w-full h-full relative">
            {/* Search Panel */}
            <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                {/* Header */}
                <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discover</h1>
                </header>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
                            <SearchIcon size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find people..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Random Chat CTA - Always visible if no search results? Or always at top? */}
                    {!query && (
                        <div className="mb-8">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Community</h2>
                            <button
                                onClick={() => navigate('/random-chat')}
                                className="w-full group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-primary-500/25 transition-all transform hover:-translate-y-0.5"
                            >
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm text-white">
                                    <Shuffle size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white text-lg">Random Match</h3>
                                    <p className="text-primary-100 text-sm">Meet new people instantly</p>
                                </div>
                                <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                                    <MessageCircle size={120} />
                                </div>
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 mb-3 text-primary-500 animate-spin" />
                            <p className="text-sm">Searching users...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">People</h2>
                            {results.map((foundUser) => (
                                <div
                                    key={foundUser.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                    onClick={() => startChat(foundUser)}
                                >
                                    <img
                                        src={foundUser.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.full_name)}&background=0EA5E9&color=fff`}
                                        alt={foundUser.full_name}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {foundUser.full_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                            <span className="text-primary-500">@</span>
                                            {foundUser.username}
                                        </p>
                                    </div>
                                    <button className="p-2 text-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MessageCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <UserIcon size={48} className="mb-4 opacity-20" />
                            <p>No users found matching "{query}"</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Right Side Placeholder (Desktop) */}
            <div className="hidden md:flex flex-1 bg-gray-50 dark:bg-gray-950">
                <EmptyChat />
            </div>
        </div>
    );
}
