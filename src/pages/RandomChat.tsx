import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';

export function RandomChat() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [status, setStatus] = useState<'searching' | 'found' | 'error'>('searching');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        findRandomMatch();
    }, []);

    const findRandomMatch = async () => {
        if (!user) return;

        try {
            // 1. Get IDs of users I already chatted with to exclude them (optional preference?)
            // For true random logic, we might accept repeat matches, but let's prioritize new people.
            // Or just random from 'users' check.

            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .neq('id', user.id);

            if (countError) throw countError;

            if (count === null || count === 0) {
                setStatus('error');
                setErrorMsg('No other users found.');
                return;
            }

            // 2. Pick a random offset
            const randomOffset = Math.floor(Math.random() * count);

            // 3. Fetch that user
            const { data: randomUsers, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .neq('id', user.id)
                .range(randomOffset, randomOffset)
                .limit(1);

            if (fetchError) throw fetchError;

            if (!randomUsers || randomUsers.length === 0) {
                setStatus('error');
                setErrorMsg('Could not find a match.');
                return;
            }

            const match = randomUsers[0];

            // 4. Create or Get Chat
            const { data: chatId, error: chatError } = await supabase
                .rpc('get_or_create_chat', { user1: user.id, user2: match.id });

            if (chatError) throw chatError;

            setStatus('found');

            // Short delay for visual effect
            setTimeout(() => {
                navigate(`/chat/${chatId}`, { state: { otherUserId: match.id } });
            }, 1500);

        } catch (error: any) {
            console.error('Random match error:', error);
            setStatus('error');
            setErrorMsg(error.message || 'Failed to find a match');
        }
    };

    return (
        <div className="flex items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30">
                    <Shuffle className={`text-white ${status === 'searching' ? 'animate-spin-slow' : ''}`} size={40} />
                </div>

                {status === 'searching' && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Finding a Match</h2>
                        <p className="text-gray-500">Looking for someone to chat with...</p>
                        <div className="mt-8 flex justify-center gap-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </>
                )}

                {status === 'found' && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Match Found!</h2>
                        <p className="text-green-500 font-medium">Redirecting to chat...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
                        <p className="text-red-500 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => { setStatus('searching'); findRandomMatch(); }}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Shuffle size={18} />
                            Try Again
                        </button>
                    </>
                )}

                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 underline"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
