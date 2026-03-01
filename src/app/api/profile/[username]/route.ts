import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
    const params = await context.params;
    const { username } = params;

    // We await createClient to satisfy Next.js guidelines
    const supabase = await createClient();

    try {
        // 1. Fetch Profile
        const { data: profile, error: profileErr } = await supabase.from('profiles')
            .select('id, username, bio, avatar_url, country')
            .ilike('username', username)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 2. Fetch Stats
        const { data: stats } = await supabase.from('leaderboard_stats')
            .select('win_rate, trades_count, total_pnl, total_return_pct')
            .eq('user_id', profile.id)
            .single();

        // 3. Fetch Recent Trades (limit 5)
        const { data: trades } = await supabase.from('trades')
            .select('symbol, type, status, created_at, avg_price')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // 4. Derive Favorite Stocks
        const symbolCounts: Record<string, number> = {};
        if (trades) {
            trades.forEach(t => {
                symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
            });
        }
        const favStocks = Object.entries(symbolCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        return NextResponse.json({
            profile,
            stats: stats || {},
            recentTrades: trades || [],
            favStocks
        });

    } catch (error) {
        console.error('Quickview API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
