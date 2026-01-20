import { Home } from './Home';
import { ChatWindow } from '../components/chat/ChatWindow';

export function ResponsiveChat() {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            {/* Chat List - Hidden on Mobile (since we are in Chat view), Visible on Desktop */}
            <div className="hidden md:flex w-[380px] lg:w-[420px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <Home />
            </div>

            {/* Chat Window - Full width on Mobile, Remaining on Desktop */}
            <div className="w-full md:flex-1 h-full relative">
                <ChatWindow />
            </div>
        </div>
    );
}
