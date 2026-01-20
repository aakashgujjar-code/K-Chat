import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Sidebar Navigation */}
            <div className="flex-shrink-0 h-full z-50">
                <Navigation />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 h-full overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}
