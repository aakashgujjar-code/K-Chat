// Helper Types
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface UserRow {
    id: string;
    email: string;
    full_name: string;
    username: string;
    date_of_birth: string;
    gender: string;
    profile_picture_url: string | null;
    profile_visibility: string;
    online_status_visible: boolean;
    is_online: boolean;
    last_seen: string | null;
    username_last_changed: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserInsert {
    id: string;
    email: string;
    full_name: string;
    username: string;
    date_of_birth: string;
    gender: string;
    profile_picture_url?: string | null;
    profile_visibility?: string;
    online_status_visible?: boolean;
    is_online?: boolean;
    last_seen?: string | null;
    username_last_changed?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UserUpdate extends Partial<UserInsert> { }

export interface ChatRow {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
    updated_at: string;
}

export interface ChatInsert {
    id?: string;
    user1_id: string;
    user2_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface ChatUpdate extends Partial<ChatInsert> { }

export interface MessageRow {
    id: string;
    chat_id: string;
    sender_id: string;
    receiver_id: string;
    message_type: string;
    content: string | null;
    is_read: boolean;
    is_deleted_everyone: boolean;
    deleted_by: string[];
    created_at: string;
}

export interface MessageInsert {
    id?: string;
    chat_id: string;
    sender_id: string;
    receiver_id: string;
    message_type: string;
    content?: string | null;
    is_read?: boolean;
    created_at?: string;
}

export interface MessageUpdate extends Partial<MessageInsert> { }

export interface StatusRow {
    id: string;
    user_id: string;
    content: string;
    visibility: string;
    view_count: number;
    expires_at: string;
    created_at: string;
}

export interface StatusInsert {
    id?: string;
    user_id: string;
    content: string;
    visibility: string;
    view_count?: number;
    expires_at: string;
    created_at?: string;
}

export interface StatusUpdate extends Partial<StatusInsert> { }

export interface UserSettingsRow {
    user_id: string;
    theme_mode: string;
    color_theme: string;
    bubble_style: string;
    font_size: string;
    status_visibility: string;
    chat_wallpaper_url: string | null;
    updated_at: string;
}

export interface UserSettingsInsert {
    user_id: string;
    theme_mode?: string;
    color_theme?: string;
    bubble_style?: string;
    font_size?: string;
    status_visibility?: string;
    chat_wallpaper_url?: string | null;
    updated_at?: string;
}

export interface UserSettingsUpdate extends Partial<UserSettingsInsert> { }

export interface StatusViewRow {
    id: string;
    status_id: string;
    viewer_id: string;
    viewed_at: string;
}

export interface StatusViewInsert {
    id?: string;
    status_id: string;
    viewer_id: string;
    viewed_at?: string;
}

export interface StatusViewUpdate extends Partial<StatusViewInsert> { }

export interface Database {
    public: {
        Tables: {
            users: {
                Row: UserRow;
                Insert: UserInsert;
                Update: UserUpdate;
            };
            chats: {
                Row: ChatRow;
                Insert: ChatInsert;
                Update: ChatUpdate;
            };
            messages: {
                Row: MessageRow;
                Insert: MessageInsert;
                Update: MessageUpdate;
            };
            statuses: {
                Row: StatusRow;
                Insert: StatusInsert;
                Update: StatusUpdate;
            };
            user_settings: {
                Row: UserSettingsRow;
                Insert: UserSettingsInsert;
                Update: UserSettingsUpdate;
            };
            status_views: {
                Row: StatusViewRow;
                Insert: StatusViewInsert;
                Update: StatusViewUpdate;
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_or_create_chat: {
                Args: { user1: string; user2: string };
                Returns: string;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
