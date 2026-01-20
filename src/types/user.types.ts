// User-related types
export interface User {
    id: string;
    email: string;
    full_name: string;
    username: string;
    date_of_birth: string;
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    profile_picture_url?: string;
    profile_visibility: 'public' | 'private';
    online_status_visible: boolean;
    is_online: boolean;
    last_seen?: string;
    username_last_changed?: string;
    created_at: string;
    updated_at: string;
}

export interface UserSettings {
    user_id: string;
    theme_mode: 'light' | 'dark' | 'auto';
    color_theme: string;
    bubble_style: 'rounded' | 'sharp';
    font_size: 'small' | 'medium' | 'large';
    status_visibility: 'everyone' | 'chatlist' | 'nobody';
    chat_wallpaper_url?: string;
    updated_at: string;
}
