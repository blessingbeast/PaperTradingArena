import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/watchlist - Fetch user's watchlist for a specific group
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const listName = searchParams.get('list_name') || 'Watchlist 1';

    try {
        const { data, error } = await supabase
            .from('watchlists')
            .select('symbol')
            .eq('user_id', session.user.id)
            .eq('list_name', listName);

        if (error) throw error;
        return NextResponse.json(data.map(item => item.symbol));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/watchlist - Add to watchlist
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { symbol, list_name = 'Watchlist 1' } = await request.json();
        if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

        const { data: existing } = await supabase
            .from('watchlists')
            .select('symbol')
            .eq('user_id', session.user.id)
            .eq('symbol', symbol)
            .eq('list_name', list_name)
            .maybeSingle();

        if (existing) return NextResponse.json({ success: true });

        const { error } = await supabase
            .from('watchlists')
            .insert({ user_id: session.user.id, symbol, list_name });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/watchlist - Remove from watchlist
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { symbol, list_name = 'Watchlist 1' } = await request.json();
        if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

        const { error } = await supabase
            .from('watchlists')
            .delete()
            .eq('user_id', session.user.id)
            .eq('symbol', symbol)
            .eq('list_name', list_name);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
