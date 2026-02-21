
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: trades, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', session.user.id)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return NextResponse.json(trades);
    } catch (error: any) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
