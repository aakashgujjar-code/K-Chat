import { useState, useEffect } from 'react';
import { Eye, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../utils';

interface ChatWithUsers {
    id: string;
    user1: { full_name: string; username: string };
    user2: { full_name: string; username: string };
    created_at: string;
    messageCount?: number;
    lastMessage?: string;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    message_type: string;
    created_at: string;
    sender?: { full_name: string; username: string };
}

export function ChatManagement() {
    const [chats, setChats] = useState<ChatWithUsers[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
          *,
          user1:users!chats_user1_id_fkey(full_name, username),
          user2:users!chats_user2_id_fkey(full_name, username)
        `)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Get message count for each chat
            const chatsWithCount = await Promise.all(
                (data || []).map(async (chat) => {
                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('chat_id', chat.id);

                    return { ...chat, messageCount: count || 0 };
                })
            );

            setChats(chatsWithCount as ChatWithUsers[]);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const viewChatHistory = async (chatId: string) => {
        setSelectedChat(chatId);
        setLoadingMessages(true);

        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`*, sender:users!messages_sender_id_fkey(full_name, username)`)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            setChatMessages(data as Message[]);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            const { error } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId);

            if (error) throw error;

            setChats(chats.filter(c => c.id !== chatId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting chat:', error);
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
                <h1 className="text-2xl font-bold text-white">Chats</h1>
                <p className="text-gray-400">{chats.length} total chats</p>
            </div>

            {/* Chats Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-700/50">
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User 1</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User 2</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Messages</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Created</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chats.map((chat) => (
                                <tr key={chat.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3 text-white">
                                        <span className="font-medium">{chat.user1?.full_name}</span>
                                        <span className="text-gray-400 text-sm ml-2">@{chat.user1?.username}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white">
                                        <span className="font-medium">{chat.user2?.full_name}</span>
                                        <span className="text-gray-400 text-sm ml-2">@{chat.user2?.username}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{chat.messageCount}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {formatRelativeTime(chat.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewChatHistory(chat.id)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(chat.id)}
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

            {/* Chat History Modal */}
            {selectedChat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white">Chat History</h2>
                            <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingMessages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No messages in this chat</p>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div key={msg.id} className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-white">@{msg.sender?.username}</span>
                                            <span className="text-xs text-gray-400">{formatRelativeTime(msg.created_at)}</span>
                                        </div>
                                        <p className="text-gray-300">
                                            {msg.message_type === 'image' ? '📷 [Image]' : msg.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-2">Delete Chat?</h2>
                        <p className="text-gray-400 mb-4">This will permanently delete the chat and all messages.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteChat(deleteConfirm)}
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
