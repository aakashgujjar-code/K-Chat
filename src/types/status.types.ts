import type { User } from './user.types';

// Status-related types
export interface Status {
    id: string;
    user_id: string;
    user?: User;
    content: string;
    visibility: 'chatlist' | 'everyone';
    view_count: number;
    expires_at: string;
    created_at: string;
}

export interface StatusView {
    id: string;
    status_id: string;
    viewer_id: string;
    viewer?: User;
    viewed_at: string;
}
