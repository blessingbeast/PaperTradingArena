import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();

    // Auth Check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    const type = searchParams.get('type') || 'combined';
    const searchQuery = searchParams.get('search') || '';
    const friendsOnly = searchParams.get('friends') === 'true';
    const minTrades = parseInt(searchParams.get('minTrades') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'return';

    try {
        let friendIds: string[] = [];
        if (friendsOnly) {
            const { data: friends } = await supabase.from('friends').select('friend_id').eq('user_id', session.user.id);
            friendIds = friends?.map(f => f.friend_id) || [];
            if (friendIds.length === 0) return NextResponse.json([]); // No friends to show
        }

        // Fetch snapshots and profiles
        let snapQuery = supabase.from('leaderboard_snapshots').select(`
            rank,
            equity,
            total_pnl,
            total_return_pct,
            user_id,
            profiles!inner (
                username,
                avatar_url,
                country,
                is_private
            )
        `).eq('period', period).eq('profiles.is_private', false);

        if (searchQuery) {
            snapQuery = snapQuery.ilike('profiles.username', `%${searchQuery}%`);
        }

        if (friendsOnly) {
            snapQuery = snapQuery.in('user_id', friendIds);
        }

        const { data: snaps, error: snapErr } = await snapQuery.limit(500);
        if (snapErr) throw snapErr;
        if (!snaps || snaps.length === 0) return NextResponse.json([]);

        const userIds = snaps.map(s => s.user_id);

        // Fetch leaderboard_stats for these users
        const { data: statsData } = await supabase.from('leaderboard_stats').select('*').in('user_id', userIds);
        const statsMap = new Map(statsData?.map(s => [s.user_id, s]) || []);

        // Fetch badges
        const { data: badgesData } = await supabase.from('user_badges').select('user_id, badge').in('user_id', userIds);
        const badgeMap = new Map();
        if (badgesData) {
            badgesData.forEach(b => {
                if (!badgeMap.has(b.user_id)) badgeMap.set(b.user_id, []);
                badgeMap.get(b.user_id).push(b.badge);
            });
        }

        let formattedData = snaps.map(item => {
            const stats = statsMap.get(item.user_id) || {} as any;
            const profile = item.profiles as any;

            return {
                baseRank: item.rank, // Original period rank
                userId: item.user_id,
                username: profile.username || 'Anonymous',
                avatar: profile.avatar_url,
                country: profile.country,
                equity: item.equity,
                pnl: item.total_pnl,
                returnPct: item.total_return_pct,
                trades: stats.trades_count || 0,
                winRate: stats.win_rate || 0,
                stockPnl: stats.stock_pnl || 0,
                fnoPnl: stats.fno_pnl || 0,
                badges: badgeMap.get(item.user_id) || []
            };
        });

        // Apply Min Trades Filter
        if (minTrades > 0) {
            formattedData = formattedData.filter(d => d.trades >= minTrades);
        }

        // Apply Sorting
        if (sortBy === 'winRate') {
            formattedData.sort((a, b) => b.winRate - a.winRate);
        } else if (sortBy === 'pnl') {
            formattedData.sort((a, b) => b.pnl - a.pnl);
        } else if (sortBy === 'trades') {
            formattedData.sort((a, b) => b.trades - a.trades);
        } else {
            // default returnPct
            formattedData.sort((a, b) => b.returnPct - a.returnPct);
        }

        // Recalculate display rank after filtering/sorting
        formattedData = formattedData.map((d, idx) => ({ ...d, rank: idx + 1 })).slice(0, 100);

        return NextResponse.json(formattedData);

    } catch (e: any) {
        console.error('Leaderboard Fetch Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
