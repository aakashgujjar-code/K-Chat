import { MessageCircle } from 'lucide-react';

export function EmptyChat() {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">K Chat for Web</h2>
            <p className="text-gray-500 mt-2 text-center max-w-md px-6">
                Send and receive messages without keeping your phone online.<br />
                Use K Chat on up to 4 linked devices and 1 phone.
            </p>
        </div>
    );
}
