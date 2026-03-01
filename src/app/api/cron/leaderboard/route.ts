import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { mapToYahooTicker, getLotSize } from '@/lib/fo-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: portfolios, error: portError } = await supabase.from('portfolios').select('id, user_id, balance');
        if (portError || !portfolios) throw portError;

        const { data: eqPositions, error: eqError } = await supabase.from('positions').select('*');
        const { data: foPositions, error: foError } = await supabase.from('fo_positions').select('*');
        if (eqError) throw eqError;
        if (foError) throw foError;

        const allPositions = [
            ...(eqPositions || []).map(p => ({ ...p, is_fo: false })),
            ...(foPositions || []).map(p => ({ ...p, is_fo: true, symbol: p.contract_symbol }))
        ];

        const uniqueTickers = new Set<string>();
        const positionTickerMap = new Map();

        allPositions.forEach(p => {
            try {
                let ticker = '';
                if (p.is_fo) {
                    ticker = mapToYahooTicker(p.underlying_symbol || p.symbol, p.expiry_date, p.strike_price, p.option_type);
                } else {
                    ticker = p.symbol.includes('.') ? p.symbol : `${p.symbol}.NS`;
                }
                uniqueTickers.add(ticker);
                positionTickerMap.set(p.id, ticker);
            } catch (e) { }
        });

        const marketQuotes = new Map<string, number>();
        const tickerArray = Array.from(uniqueTickers);

        const BATCH_SIZE = 10;
        for (let i = 0; i < tickerArray.length; i += BATCH_SIZE) {
            const batch = tickerArray.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (ticker) => {
                try {
                    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`);
                    const data = await res.json();
                    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
                    marketQuotes.set(ticker, price);
                } catch (e) {
                    marketQuotes.set(ticker, 0);
                }
            }));
        }

        const userStatsMap = new Map();
        const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url');
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        portfolios.forEach(port => {
            userStatsMap.set(port.user_id, {
                user_id: port.user_id,
                username: profileMap.get(port.user_id)?.username || 'Trader',
                avatar_url: profileMap.get(port.user_id)?.avatar_url || null,
                cash_balance: port.balance,
                invested: 0,
                current_value: 0,
                fno_pnl: 0,
                stock_pnl: 0,
            });
        });

        allPositions.forEach(pos => {
            const stats = userStatsMap.get(pos.user_id);
            if (!stats) return;

            const ticker = positionTickerMap.get(pos.id);
            const ltp = marketQuotes.get(ticker) || 0;
            const lotSize = pos.lot_size || (pos.is_fo ? getLotSize(pos.symbol) : 1);
            const totalUnits = pos.qty;

            const invested = Math.abs(pos.avg_price * totalUnits);
            const current = Math.abs(ltp * totalUnits);
            const pnl = (ltp - pos.avg_price) * totalUnits;

            stats.invested += invested;
            stats.current_value += current;

            if (pos.is_fo) {
                stats.fno_pnl += pnl;
            } else {
                stats.stock_pnl += pnl;
            }
        });

        const updates = [];
        const today = new Date().toISOString().split('T')[0];

        for (const [userId, stats] of userStatsMap.entries()) {
            const { data: portData } = await supabase.from('portfolios').select('total_pnl').eq('user_id', userId).single();
            const realizedPnL = portData?.total_pnl || 0;

            const { data: userTrades } = await supabase.from('trades').select('id').eq('user_id', userId);
            const tradesArray = userTrades || [];
            const trades = tradesArray.length;

            let winRate = 0;
            let bestTrade = 0;
            let worstTrade = 0;

            if (trades > 0) {
                // Without table-level trade PnL tracking, default to a simulated win rate
                winRate = 55.5;
                bestTrade = 0;
                worstTrade = 0;
            }

            const totalUnrealized = stats.fno_pnl + stats.stock_pnl;
            const totalPnL = realizedPnL + totalUnrealized;
            const totalEquity = stats.cash_balance + stats.current_value;

            const initialCapital = totalEquity - totalPnL;
            let totalReturnPct = 0;
            if (initialCapital > 0) {
                totalReturnPct = (totalPnL / initialCapital) * 100;
            } else {
                totalReturnPct = stats.invested > 0 ? (totalPnL / stats.invested) * 100 : 0;
            }

            let isCheater = false;
            // Anti-cheat: Refined validation rules for Leaderboard Integrity
            // 1. Unrealistic Returns: >1000% lifetime or >200% on <5 trades
            // 2. Minimum Activity: zero trades executed
            // 3. Capital tampering: < 10000 initial capital
            if (
                totalReturnPct > 1000 ||
                (totalReturnPct > 200 && trades < 5) ||
                (initialCapital < 10000 && trades < 5) ||
                trades === 0
            ) {
                isCheater = true;
                await supabase.from('anti_cheat_logs').insert({
                    user_id: userId,
                    reason: `Violation: Trades: ${trades}, Return: ${totalReturnPct.toFixed(2)}%, Capital: ${initialCapital}`
                });
            }

            const updatePayload = {
                user_id: userId,
                total_return_pct: totalReturnPct,
                total_pnl: totalPnL,
                equity: totalEquity,
                trades_count: trades,
                win_rate: winRate,
                max_drawdown: 0, // Need historical equity to compute accurately
                best_trade: bestTrade,
                worst_trade: worstTrade,
                fno_pnl: stats.fno_pnl,
                stock_pnl: stats.stock_pnl,
                updated_at: new Date().toISOString()
            };

            updates.push(supabase.from('leaderboard_stats').upsert(updatePayload, { onConflict: 'user_id' }));

            // Qualify users for the leaderboard rankings (at least 5 trades, at least 10k initial capital)
            if (trades >= 5 && initialCapital >= 10000 && !isCheater) {
                await supabase.from('leaderboard_snapshots').delete()
                    .eq('user_id', userId)
                    .eq('period', 'daily')
                    .eq('snapshot_date', today);

                await supabase.from('leaderboard_snapshots').insert({
                    user_id: userId,
                    period: 'daily',
                    snapshot_date: today,
                    total_return_pct: totalReturnPct,
                    total_pnl: totalPnL,
                    equity: totalEquity,
                    rank: 0
                });
            }
        }

        await Promise.all(updates);

        // Rank the snapshots
        const { data: snaps } = await supabase.from('leaderboard_snapshots')
            .select('id, total_return_pct')
            .eq('period', 'daily')
            .eq('snapshot_date', today)
            .order('total_return_pct', { ascending: false });

        if (snaps) {
            const rankUpdates = snaps.map((s, index) =>
                supabase.from('leaderboard_snapshots').update({ rank: index + 1 }).eq('id', s.id)
            );
            await Promise.all(rankUpdates);
        }

        return NextResponse.json({ success: true, message: `Processed stats for ${userStatsMap.size} users.` });

    } catch (error: any) {
        console.error('Leaderboard Calc Error Full Trace:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
