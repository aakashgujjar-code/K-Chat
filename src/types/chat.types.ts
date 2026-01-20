import type { User } from './user.types';

// Chat-related types
export interface Chat {
    id: string;
    user1_id: string;
    user2_id: string;
    user1?: User;
    user2?: User;
    last_message?: Message;
    unread_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    receiver_id: string;
    message_type: 'text' | 'image' | 'emoji';
    content: string;
    is_read: boolean;
    is_delivered?: boolean;
    is_deleted_everyone?: boolean;
    deleted_by?: string[];
    created_at: string;
}

export interface RandomChatSession {
    id: string;
    user1_id: string;
    user2_id: string;
    status: 'active' | 'disconnected';
    created_at: string;
    ended_at?: string;
}

export interface RandomChatMessage {
    id: string;
    session_id: string;
    sender_id: string;
    message_type: 'text' | 'emoji';
    content: string;
    created_at: string;
}
