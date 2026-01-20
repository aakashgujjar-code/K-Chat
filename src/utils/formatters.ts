import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

export const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);

    if (isToday(date)) {
        return format(date, 'h:mm a');
    }

    if (isYesterday(date)) {
        return 'Yesterday';
    }

    // Within last 7 days
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
        return format(date, 'EEEE'); // Day name
    }

    // Older dates
    return format(date, 'MMM d');
};

export const formatRelativeTime = (timestamp: string): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const formatMessageTime = (timestamp: string): string => {
    return format(new Date(timestamp), 'h:mm a');
};

export const formatLastSeen = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);

    if (isToday(date)) {
        return `today at ${format(date, 'h:mm a')}`;
    }

    if (isYesterday(date)) {
        return `yesterday at ${format(date, 'h:mm a')}`;
    }

    return format(date, 'MMM d \'at\' h:mm a');
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};
