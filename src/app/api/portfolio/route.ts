import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { mapToYahooTicker, getLotSize } from '@/lib/fo-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).maybeSingle();

        if (!portfolio) {
            return NextResponse.json({
                balance: 100000,
                invested: 0,
                currentValue: 0,
                totalPnL: 0,
                realizedPnL: 0,
                unrealizedPnL: 0,
                holdings: []
            });
        }

        const { data: eqPositions } = await supabase.from('positions').select('*').eq('user_id', session.user.id);
        const { data: foPositions } = await supabase.from('fo_positions').select('*').eq('user_id', session.user.id);

        const unifiedPositions = [
            ...(eqPositions || []).map(p => ({ ...p, is_fo: false })),
            ...(foPositions || []).map(p => ({ ...p, is_fo: true, symbol: p.contract_symbol }))
        ];


        // 3. Resolve Real Tickers
        const debugInfo: any = {};
        const yahooTickers = unifiedPositions.map(p => {
            let ticker = '';
            try {
                if (p.is_fo) {
                    ticker = mapToYahooTicker(p.underlying_symbol || p.symbol, p.expiry_date, p.strike_price, p.option_type);
                } else {
                    ticker = p.symbol.includes('.') ? p.symbol : `${p.symbol}.NS`;
                }
                debugInfo[p.symbol] = { ticker, asset_class: p.is_fo ? 'FO' : 'EQ' };
                return ticker;
            } catch (err) {
                console.error(`[PortfolioAPI] Error mapping ticker for ${p.symbol}:`, err);
                return null;
            }
        }).filter(t => t !== null) as string[];


        // 4. Batch Fetch Market Data (Strictly Yahoo)
        const marketQuotes = new Map();
        if (yahooTickers.length > 0) {
            await Promise.all(yahooTickers.map(async (ticker) => {
                try {
                    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { next: { revalidate: 60 } });
                    const data = await res.json();

                    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
                    marketQuotes.set(ticker, price);
                    // Update debug info
                    for (const sym in debugInfo) {
                        if (debugInfo[sym].ticker === ticker) {
                            debugInfo[sym].last_price = price;
                        }
                    }
                } catch (e) {
                    marketQuotes.set(ticker, 0);
                }
            }));
        }

        // 5. Calculate Metrics
        let totalInvested = 0;
        let currentValueSum = 0;
        let totalUnrealizedPnL = 0;

        const holdings = unifiedPositions.map(pos => {
            const ticker = debugInfo[pos.symbol]?.ticker;
            const ltp = marketQuotes.get(ticker) || 0;
            const lotSize = pos.lot_size || getLotSize(pos.symbol);
            const totalUnits = pos.qty; // POS already stores total units

            const invested = Math.abs(pos.avg_price * totalUnits);
            const current = Math.abs(ltp * totalUnits);

            // P&L Formula: (LTP - AvgPrice) * Qty
            // Note: Qty in positions is already signed (positive for long, negative for short)
            const pnl = (ltp - pos.avg_price) * totalUnits;

            totalInvested += invested;
            currentValueSum += current;
            totalUnrealizedPnL += pnl;

            return {
                ...pos,
                ltp: ltp || 0,
                ticker,
                current,
                invested,
                pnl,
                percent: invested > 0 ? (pnl / invested) * 100 : 0,
                lot_size: lotSize,
                is_live: ltp > 0
            };
        });

        return NextResponse.json({
            balance: portfolio.balance,
            invested: totalInvested,
            currentValue: currentValueSum,
            realizedPnL: portfolio.total_pnl || 0,
            unrealizedPnL: totalUnrealizedPnL,
            totalPnL: (portfolio.total_pnl || 0) + totalUnrealizedPnL,
            holdings,
            is_live_sync: true,
            _debug: debugInfo
        });

    } catch (error) {
        console.error('Portfolio API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
