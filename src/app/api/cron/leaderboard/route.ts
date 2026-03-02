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
        const debugInfo: any = {};

        allPositions.forEach(p => {
            try {
                let ticker = '';
                if (p.is_fo) {
                    let underlying = p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '');
                    if (underlying === 'NIFTY') ticker = '^NSEI';
                    else if (underlying === 'BANKNIFTY') ticker = '^NSEBANK';
                    else if (underlying === 'FINNIFTY') ticker = '^CNXFIN';
                    else ticker = underlying.includes('.') ? underlying : `${underlying}.NS`;

                    debugInfo[p.id] = { is_fo: true, expiry: p.expiry_date, strike: p.strike_price, type: p.option_type };
                } else {
                    ticker = p.symbol.includes('.') ? p.symbol : `${p.symbol}.NS`;
                    debugInfo[p.id] = { is_fo: false };
                }
                uniqueTickers.add(ticker);
                positionTickerMap.set(p.id, ticker);
            } catch (e) { }
        });

        // 4. Batch Fetch Market Data (Strictly Yahoo for EQ/Index, NSE for Options)
        const marketQuotes = new Map<string, number>();
        const tickerArray = Array.from(uniqueTickers).filter(t => !debugInfo[Object.keys(debugInfo).find(k => debugInfo[k].ticker === t) || '']?.is_fo);

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

        // 4b. Fetch Options from NSE India
        const nseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        };

        const uniqueUnderlyings = [...new Set(allPositions.filter(p => p.is_fo).map(p => p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '')))];

        if (uniqueUnderlyings.length > 0) {
            try {
                // Get NSE Session Cookies
                const baseRes = await fetch('https://www.nseindia.com', { headers: nseHeaders, next: { revalidate: 30 } });
                const cookies = baseRes.headers.get('set-cookie');
                const fetchHeaders: HeadersInit = { ...nseHeaders, 'Accept': 'application/json' };
                if (cookies) fetchHeaders['Cookie'] = cookies.split(',').map((c: string) => c.split(';')[0]).join('; ');

                // Fetch Option Chain for each underlying
                for (const underlying of uniqueUnderlyings) {
                    let symbolQuery = underlying.toUpperCase();
                    if (symbolQuery === 'NIFTY') symbolQuery = 'NIFTY';
                    else if (symbolQuery === 'BANKNIFTY') symbolQuery = 'BANKNIFTY';
                    else if (symbolQuery === 'FINNIFTY') symbolQuery = 'FINNIFTY';

                    try {
                        const apiRes = await fetch(`https://www.nseindia.com/api/option-chain-indices?symbol=${symbolQuery}`, { headers: fetchHeaders, next: { revalidate: 30 } });
                        if (apiRes.ok) {
                            const data = await apiRes.json();
                            const records = data.records?.data || [];

                            // Map fetched options to portfolio positions
                            const relatedPositions = allPositions.filter(p => p.is_fo && (p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '')) === underlying);
                            for (const pos of relatedPositions) {
                                const record = records.find((r: any) => r.strikePrice === pos.strike_price && r.expiryDate === pos.expiry_date);
                                if (record) {
                                    const optData = pos.option_type === 'CE' ? record.CE : record.PE;
                                    const ltp = optData?.lastPrice || 0;
                                    marketQuotes.set(positionTickerMap.get(pos.id), ltp);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('NSE Option Fetch Error for Leaderboard Cron:', underlying, e);
                    }
                }
            } catch (e) {
                console.error('NSE Cookie Fetch Error for Leaderboard Cron:', e);
            }
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

            const info = debugInfo[pos.id];
            const ticker = positionTickerMap.get(pos.id);
            let ltp = marketQuotes.get(ticker) || 0;

            if (info?.is_fo && ltp === 0) {
                // For the cron job, if we failed to fetch the real NSE option quote, fallback to 0 instead of Black-Scholes
                // because calculating fake prices messes up global gamification equity state.
            }

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
