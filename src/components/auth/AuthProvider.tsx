'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const setData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) console.error(error);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle instantaneous redirect flows
            if (session && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
                router.replace('/dashboard');
            } else if (!session && pathname.startsWith('/dashboard')) {
                router.replace('/login');
            }
        });

        setData();

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [supabase, pathname, router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {loading ? (
                <div className="fixed inset-0 min-h-screen z-[100000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground animate-pulse">Authenticating...</h2>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
