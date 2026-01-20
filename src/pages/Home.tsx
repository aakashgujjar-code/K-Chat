import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { formatTimestamp, truncateText } from '../utils';
import type { Chat, Message, User } from '../types';

interface ChatWithDetails extends Omit<Chat, 'last_message'> {
    other_user: User;
    last_message?: Message | null;
    unread_count: number;
}

export function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [chats, setChats] = useState<ChatWithDetails[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;

        fetchChats();
        fetchBlockedUsers();

        // Subscribe to new messages
        const channel = supabase
            .channel('home-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, () => {
                fetchChats();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
            }, () => {
                fetchChats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchChats = async () => {
        if (!user) return;

        try {
            // Fetch chats where user is a participant
            const { data: chatsData, error: chatsError } = await supabase
                .from('chats')
                .select(`
          *,
          user1:users!chats_user1_id_fkey(*),
          user2:users!chats_user2_id_fkey(*)
        `)
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (chatsError) throw chatsError;

            // Get last message and unread count for each chat
            const chatsWithDetails = await Promise.all(
                (chatsData || []).map(async (chat) => {
                    const otherUser = chat.user1_id === user.id ? chat.user2 : chat.user1;

                    // Get last message (that is not deleted for me)
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('chat_id', chat.id)
                        .order('created_at', { ascending: false })
                        .limit(5); // Fetch a few to find the last visible one

                    const lastMessage = messages?.find(m => !m.is_deleted_everyone && !m.deleted_by?.includes(user!.id)) || null;

                    // Get unread count (excluding messages deleted for me or everyone)
                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('chat_id', chat.id)
                        .eq('receiver_id', user.id)
                        .eq('is_read', false)
                        .eq('is_deleted_everyone', false)
                        .not('deleted_by', 'cs', `{${user.id}}`);

                    return {
                        ...chat,
                        other_user: otherUser,
                        last_message: lastMessage,
                        unread_count: count || 0,
                    };
                })
            );

            setChats(chatsWithDetails);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBlockedUsers = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('blocked_users')
            .select('blocked_user_id')
            .eq('user_id', user.id);
        setBlockedUserIds(data?.map(b => b.blocked_user_id) || []);
    };

    const filteredChats = chats.filter(chat => {
        const isBlocked = blockedUserIds.includes(chat.other_user.id);
        const matchesSearch = chat.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.other_user.username.toLowerCase().includes(searchQuery.toLowerCase());
        return !isBlocked && matchesSearch;
    });

    const handleChatClick = (chatId: string, otherUserId: string) => {
        navigate(`/chat/${chatId}`, { state: { otherUserId } });
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h1>
                <img
                    src={user?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=0EA5E9&color=fff`}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate('/settings/profile')}
                />
            </header>

            {/* Search */}
            <div className="px-4 py-3">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <MessageCircle size={48} className="mb-2 opacity-50" />
                        <p>No chats yet</p>
                        <p className="text-sm">Search for users to start chatting</p>
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => handleChatClick(chat.id, chat.other_user.id)}
                        >
                            {/* Avatar with online indicator */}
                            <div className="relative flex-shrink-0">
                                <img
                                    src={chat.other_user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.other_user.full_name)}&background=0EA5E9&color=fff`}
                                    alt={chat.other_user.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                {chat.other_user.is_online && chat.other_user.online_status_visible && (
                                    <span className="absolute bottom-0 right-0 online-indicator" />
                                )}
                            </div>

                            {/* Chat Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                        {chat.other_user.full_name}
                                    </h3>
                                    {chat.last_message && (
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(chat.last_message.created_at)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                        {chat.last_message?.sender_id === user?.id && !chat.last_message?.is_deleted_everyone && (
                                            <div className="flex-shrink-0">
                                                {chat.last_message?.is_read ? (
                                                    <CheckCheck size={14} className="text-blue-400" />
                                                ) : chat.last_message?.is_delivered ? (
                                                    <CheckCheck size={14} className="text-gray-400" />
                                                ) : (
                                                    <Check size={14} className="text-gray-400" />
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 truncate">
                                            {chat.last_message
                                                ? chat.last_message.message_type === 'image'
                                                    ? '📷 Photo'
                                                    : truncateText(chat.last_message.content, 35)
                                                : 'No messages yet'
                                            }
                                        </p>
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
