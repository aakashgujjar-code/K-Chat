import { Home } from './Home';
import { EmptyChat } from '../components/chat/EmptyChat';

export function ResponsiveHome() {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            {/* Chat List - Full width on Mobile, Fixed on Desktop */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <Home />
            </div>

            {/* Placeholder - Hidden on Mobile */}
            <div className="hidden md:flex flex-1 bg-gray-50 dark:bg-gray-950">
                <EmptyChat />
            </div>
        </div>
    );
}
