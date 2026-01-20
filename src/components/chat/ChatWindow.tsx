import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Smile, Image as ImageIcon, Loader2, Check, CheckCheck, MoreVertical, Ban, User as UserIcon, X, ArrowLeft, Trash, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { formatMessageTime } from '../../utils';
import type { Message, User } from '../../types';

export function ChatWindow() {
    const { chatId } = useParams<{ chatId: string }>();

    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        checkIfBlocked();
    }, [chatId, user, otherUser]);

    const checkIfBlocked = async () => {
        if (!user || !otherUser) return;
        const { data } = await supabase
            .from('blocked_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('blocked_user_id', otherUser.id)
            .single();
        setIsBlocked(!!data);
    };

    const handleBlockUser = async () => {
        if (!user || !otherUser) return;
        if (!confirm(`Are you sure you want to block ${otherUser.full_name}?`)) return;

        try {
            await supabase.from('blocked_users').insert({
                user_id: user.id,
                blocked_user_id: otherUser.id
            });
            setIsBlocked(true);
            navigate('/');
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    const handleUnblockUser = async () => {
        if (!user || !otherUser) return;
        try {
            await supabase.from('blocked_users')
                .delete()
                .eq('user_id', user.id)
                .eq('blocked_user_id', otherUser.id);
            setIsBlocked(false);
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };

    const handleDeleteChat = async () => {
        if (!chatId || !user) return;
        if (!confirm('Are you sure you want to delete this chat? This will remove all messages for you.')) return;

        try {
            const { error: delError } = await supabase
                .from('messages')
                .delete()
                .eq('chat_id', chatId);

            if (delError) throw delError;

            setMessages([]);
            setShowMenu(false);
            setMessage({ type: 'success', text: 'Chat history deleted' });
        } catch (error) {
            console.error('Error deleting chat:', error);
            setMessage({ type: 'error', text: 'Failed to delete chat' });
        }
    };

    const handleDeleteMessageMe = async (messageId: string) => {
        if (!user) return;

        // Optimistic update: remove immediately
        setMessages(prev => prev.filter(m => m.id !== messageId));

        try {
            const { data: msg } = await supabase.from('messages').select('deleted_by').eq('id', messageId).single();
            const currentDeletedBy = msg?.deleted_by || [];

            if (!currentDeletedBy.includes(user.id)) {
                const { error } = await supabase.from('messages')
                    .update({ deleted_by: [...currentDeletedBy, user.id] })
                    .eq('id', messageId);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error deleting message for me:', error);
            // Optionally restore message if failed? 
            // Better to refresh chat data to be sure
            fetchChatData();
        }
    };

    const handleDeleteMessageEveryone = async (messageId: string) => {
        // Optimistic update: remove immediately
        setMessages(prev => prev.filter(m => m.id !== messageId));

        try {
            const { error } = await supabase.from('messages')
                .update({
                    is_deleted_everyone: true,
                    content: '🚫 This message was deleted' // Keep for DB record but UI will filter
                })
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting message for everyone:', error);
            fetchChatData(); // Restore state on error
        }
    };

    const handleEmojiClick = (emoji: string) => {
        const input = inputRef.current;
        if (input) {
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = newMessage;
            const before = text.substring(0, start);
            const after = text.substring(end);
            setNewMessage(before + emoji + after);
            // Wait for render then focus and set cursor?
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setNewMessage(prev => prev + emoji);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!chatId || !user) return;

        fetchChatData();

        // Subscribe to messages
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`,
            }, async (payload) => {
                const newMsg = payload.new as Message;

                // If message was deleted for me or everyone, ignore
                if (newMsg.is_deleted_everyone || newMsg.deleted_by?.includes(user!.id)) return;

                setMessages(prev => {
                    const exists = prev.some(m => m.id === newMsg.id);
                    if (exists) {
                        return prev.map(m => m.id === newMsg.id ? newMsg : m);
                    }
                    return [...prev, newMsg];
                });

                // If I am the receiver, mark as delivered and read
                if (newMsg.receiver_id === user!.id) {
                    await markAsRead(newMsg.id);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`,
            }, (payload) => {
                const updatedMsg = payload.new as Message;

                if (updatedMsg.is_deleted_everyone || updatedMsg.deleted_by?.includes(user!.id)) {
                    setMessages(prev => prev.filter(msg => msg.id !== updatedMsg.id));
                    return;
                }

                setMessages(prev =>
                    prev.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg)
                );
            })
            .subscribe();

        // Typing indicator channel
        const typingChannel = supabase.channel(`typing:${chatId}`);

        typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (payload.user_id !== user.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        }).subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(typingChannel);
        };
    }, [chatId, user]);

    const fetchChatData = async () => {
        if (!chatId || !user) return;

        try {
            // Get chat details
            const { data: chatData } = await supabase
                .from('chats')
                .select(`
                    *,
                    user1: users!chats_user1_id_fkey(*),
                    user2: users!chats_user2_id_fkey(*)
                `)
                .eq('id', chatId)
                .single();

            if (chatData) {
                const other = chatData.user1_id === user.id ? chatData.user2 : chatData.user1;
                setOtherUser(other);
            }

            // Get messages
            const { data: messagesData } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            const visibleMessages = (messagesData || []).filter(msg =>
                !msg.is_deleted_everyone && !msg.deleted_by?.includes(user.id)
            );

            setMessages(visibleMessages);

            // Mark unread messages as read (which also implies delivered)
            await supabase
                .from('messages')
                .update({ is_read: true, is_delivered: true })
                .eq('chat_id', chatId)
                .eq('receiver_id', user.id)
                .eq('is_read', false);

        } catch (error) {
            console.error('Error fetching chat data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (messageId: string) => {
        await supabase
            .from('messages')
            .update({ is_read: true, is_delivered: true })
            .eq('id', messageId);
    };

    const handleSend = async (e?: React.FormEvent, type: 'text' | 'image' = 'text', content?: string) => {
        e?.preventDefault();
        const msgContent = content || newMessage.trim();

        if (!msgContent || !chatId || !user || !otherUser || isSending) return;

        const optimisticId = crypto.randomUUID();
        const optimisticMessage: Message = {
            id: optimisticId,
            chat_id: chatId,
            sender_id: user.id,
            receiver_id: otherUser.id,
            message_type: type,
            content: msgContent,
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);

        if (type === 'text') setNewMessage('');
        setIsSending(type === 'image');

        try {
            const { error } = await supabase.from('messages').insert({
                id: optimisticId,
                chat_id: chatId,
                sender_id: user.id,
                receiver_id: otherUser.id,
                message_type: type,
                content: msgContent,
            });

            if (error) {
                // Log the error to debug_logs table so I can see it
                await supabase.from('debug_logs').insert({
                    msg: `[handleSend] INSERT ERROR: ${error.message} (Code: ${error.code}) | User: ${user.id} | Chat: ${chatId}`
                });
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                throw error;
            }

            await supabase
                .from('chats')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', chatId);

        } catch (error) {
            console.error('Error sending message:', error);
            if (type === 'text') setNewMessage(msgContent);
        } finally {
            setIsSending(false);
            if (type === 'image') setIsUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${chatId}-${Math.random()}.${fileExt}`;
            const filePath = `chat-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            await handleSend(undefined, 'image', publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            setIsUploading(false);
        }
    };

    const handleTyping = () => {
        supabase.channel(`typing:${chatId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user?.id },
        });
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative z-20">
                <button onClick={() => navigate('/')} className="p-1 md:hidden">
                    <ArrowLeft size={24} />
                </button>

                <div className="relative">
                    <img
                        src={otherUser?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.full_name || 'U')}&background=0EA5E9&color=fff`}
                        alt={otherUser?.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    {otherUser?.is_online && otherUser?.online_status_visible && (
                        <span className="absolute bottom-0 right-0 online-indicator" />
                    )}
                </div >

                <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        {otherUser?.full_name}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {isTyping ? 'typing...' : otherUser?.is_online ? 'Online' : `@${otherUser?.username}`}
                    </p>
                </div>

                {/* 3-Dot Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 py-1 animation-scale-in">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowProfile(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm"
                                >
                                    <UserIcon size={16} />
                                    View Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleBlockUser();
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-left text-sm"
                                >
                                    <Ban size={16} />
                                    Block User
                                </button>
                                <button
                                    onClick={handleDeleteChat}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-left text-sm border-t border-gray-100 dark:border-gray-700 mt-1"
                                >
                                    <Trash2 size={16} />
                                    Delete Chat
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Feedback Message */}
                {message && (
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        {message.type === 'success' ? <Check size={18} /> : <Ban size={18} />}
                        <span className="text-sm font-medium">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-2 hover:bg-black/10 rounded-full p-0.5">
                            <X size={14} />
                        </button>
                    </div>
                )}
            </header>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 custom-scrollbar bg-[#efe7dd] dark:bg-gray-900 ${isBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
                {
                    messages.map((message) => {
                        const isSent = message.sender_id === user?.id;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isSent ? 'justify-end' : 'justify-start'} group mb-1`}
                            >
                                <div className={`relative max-w-[75%] ${isSent ? 'message-bubble-sent' : 'message-bubble-received'} ${message.is_deleted_everyone ? 'italic opacity-60' : ''}`}>
                                    {message.is_deleted_everyone ? (
                                        <p className="flex items-center gap-1.5 text-sm">
                                            <Ban size={14} className="opacity-50" />
                                            This message was deleted
                                        </p>
                                    ) : (
                                        <>
                                            {message.message_type === 'image' ? (
                                                <div className="mb-1">
                                                    <img
                                                        src={message.content || ''}
                                                        alt="Shared image"
                                                        className="rounded-lg max-h-64 object-contain cursor-pointer"
                                                        onClick={() => window.open(message.content || '', '_blank')}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="break-words">{message.content}</p>
                                            )}
                                        </>
                                    )}

                                    <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-[10px] ${isSent ? 'text-primary-200' : 'text-gray-500'} opacity-80`}>
                                            {formatMessageTime(message.created_at)}
                                        </span>
                                        {isSent && !message.is_deleted_everyone && (
                                            <div className="flex">
                                                {message.is_read ? (
                                                    <CheckCheck size={14} className="text-blue-400" />
                                                ) : message.is_delivered ? (
                                                    <CheckCheck size={14} className="text-primary-200" />
                                                ) : (
                                                    <Check size={14} className="text-primary-200" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Actions Dropdown */}
                                    {!message.is_deleted_everyone && (
                                        <div className={`absolute top-0 ${isSent ? 'right-full mr-1' : 'left-full ml-1'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        const menu = e.currentTarget.nextElementSibling;
                                                        menu?.classList.toggle('hidden');
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <div className={`hidden absolute top-0 ${isSent ? 'right-0' : 'left-0'} w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30 py-1 overflow-hidden`}>
                                                    <button
                                                        onClick={() => handleDeleteMessageMe(message.id)}
                                                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <Trash size={12} />
                                                        Delete for me
                                                    </button>
                                                    {isSent && (
                                                        <button
                                                            onClick={() => handleDeleteMessageEveryone(message.id)}
                                                            className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete for everyone
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                }
                < div ref={messagesEndRef} />
            </div >

            {/* Blocked Message */}
            {
                isBlocked && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 text-center text-gray-500 text-sm">
                        You have blocked this user. <button onClick={handleUnblockUser} className="text-primary-500 underline">Unblock</button> to send messages.
                    </div>
                )
            }

            {/* Input */}
            {
                !isBlocked && (
                    <form onSubmit={(e) => handleSend(e, 'text')} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 relative">
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                                <div className="absolute bottom-full mb-2 left-4 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-64">
                                    <div className="grid grid-cols-6 gap-2 h-48 overflow-y-auto custom-scrollbar">
                                        {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => handleEmojiClick(emoji)}
                                                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={`p-2 hover:text-gray-700 ${showEmojiPicker ? 'text-primary-500' : 'text-gray-500'}`}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile size={24} />
                            </button>
                            <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 relative"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 input"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="p-3 bg-primary-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                            >
                                {isSending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </div>
                    </form>
                )
            }

            {/* User Profile Modal */}
            {
                showProfile && otherUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Cover / Header */}
                            <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-600 relative">
                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Profile Info */}
                            <div className="px-6 pb-8 -mt-12 flex flex-col items-center text-center">
                                <img
                                    src={otherUser.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.full_name)}&background=0EA5E9&color=fff`}
                                    alt={otherUser.full_name}
                                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover bg-white"
                                />

                                <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                                    {otherUser.full_name}
                                </h2>
                                <p className="text-primary-500 font-medium">@{otherUser.username}</p>

                                <div className="mt-6 w-full space-y-3">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">Status</span>
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${otherUser.is_online ? 'text-green-500' : 'text-gray-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${otherUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {otherUser.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex flex-col gap-1 items-start">
                                        <span className="text-gray-500 text-sm">Bio</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                            "Hey there! I am using K Chat."
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="mt-8 btn-primary w-full py-4 text-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
