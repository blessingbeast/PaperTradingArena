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
                    let underlying = p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '');
                    if (underlying === 'NIFTY') ticker = '^NSEI';
                    else if (underlying === 'BANKNIFTY') ticker = '^NSEBANK';
                    else if (underlying === 'FINNIFTY') ticker = '^CNXFIN';
                    else ticker = underlying.includes('.') ? underlying : `${underlying}.NS`;

                    debugInfo[p.symbol] = {
                        ticker,
                        asset_class: 'FO',
                        original_symbol: p.symbol,
                        is_fo: true,
                        expiry: p.expiry_date,
                        strike: p.strike_price,
                        type: p.option_type
                    };
                } else {
                    ticker = p.symbol.includes('.') ? p.symbol : `${p.symbol}.NS`;
                    debugInfo[p.symbol] = { ticker, asset_class: 'EQ', original_symbol: p.symbol, is_fo: false };
                }
                return ticker;
            } catch (err) {
                console.error(`[PortfolioAPI] Error mapping ticker for ${p.symbol}:`, err);
                return null;
            }
        }).filter(t => t !== null) as string[];

        // 4. Batch Fetch Market Data (Strictly Yahoo)
        const marketQuotes = new Map();
        const uniqueTickers = [...new Set(yahooTickers)];

        if (uniqueTickers.length > 0) {
            await Promise.all(uniqueTickers.map(async (ticker) => {
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
            const info = debugInfo[pos.symbol];
            const ticker = info?.ticker;
            let ltp = marketQuotes.get(ticker) || 0;

            // Calculate simulated option price if it's an F&O position
            if (info?.is_fo && ltp > 0) {
                const r = 0.07;
                const v = 0.15;
                const now = new Date();
                const expiryDate = new Date(info.expiry);
                expiryDate.setHours(15, 30, 0, 0);

                const msPerYear = 365 * 24 * 60 * 60 * 1000;
                let T = (expiryDate.getTime() - now.getTime()) / msPerYear;
                if (T <= 0) T = 0.0001;

                const S = ltp;
                const K = info.strike;

                function CND(x: number) {
                    const a1 = 0.31938153, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
                    const L = Math.abs(x);
                    const K_c = 1.0 / (1.0 + 0.2316419 * L);
                    let w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L * L / 2) * (a1 * K_c + a2 * K_c * K_c + a3 * Math.pow(K_c, 3) + a4 * Math.pow(K_c, 4) + a5 * Math.pow(K_c, 5));
                    if (x < 0) w = 1.0 - w;
                    return w;
                }

                const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
                const d2 = d1 - v * Math.sqrt(T);

                let optPrice = 0;
                if (info.type === 'CE' || info.type === 'C') {
                    optPrice = S * CND(d1) - K * Math.exp(-r * T) * CND(d2);
                } else {
                    optPrice = K * Math.exp(-r * T) * CND(-d2) - S * CND(-d1);
                }

                ltp = Math.max(0.05, Number(optPrice.toFixed(2)));
            }

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
