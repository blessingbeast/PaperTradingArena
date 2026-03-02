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

        // 4. Batch Fetch Market Data (Strictly Yahoo for EQ/Index, NSE for Options)
        const marketQuotes = new Map();

        // 4a. Fetch Equities & Indices from Yahoo
        const uniqueYahooTickers = [...new Set(yahooTickers.filter(t => !debugInfo[Object.keys(debugInfo).find(k => debugInfo[k].ticker === t) || ''].is_fo))];
        if (uniqueYahooTickers.length > 0) {
            await Promise.all(uniqueYahooTickers.map(async (ticker) => {
                try {
                    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { next: { revalidate: 60 } });
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

        const uniqueUnderlyings = [...new Set(unifiedPositions.filter(p => p.is_fo).map(p => p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '')))];

        if (uniqueUnderlyings.length > 0) {
            try {
                // Get NSE Session Cookies
                const baseRes = await fetch('https://www.nseindia.com', { headers: nseHeaders, next: { revalidate: 30 } });
                const cookies = baseRes.headers.get('set-cookie');
                const fetchHeaders: HeadersInit = { ...nseHeaders, 'Accept': 'application/json' };
                if (cookies) fetchHeaders['Cookie'] = cookies.split(',').map(c => c.split(';')[0]).join('; ');

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
                            const relatedPositions = unifiedPositions.filter(p => p.is_fo && (p.underlying_symbol || p.symbol.replace(/[0-9].*$/, '')) === underlying);
                            for (const pos of relatedPositions) {
                                const record = records.find((r: any) => r.strikePrice === pos.strike_price && r.expiryDate === pos.expiry_date);
                                if (record) {
                                    const optData = pos.option_type === 'CE' ? record.CE : record.PE;
                                    const ltp = optData?.lastPrice || 0;
                                    marketQuotes.set(debugInfo[pos.symbol].ticker, ltp); // Store back using the unique ticker key
                                }
                            }
                        }
                    } catch (e) {
                        console.error('NSE Option Fetch Error for', underlying, e);
                    }
                }
            } catch (e) {
                console.error('NSE Cookie Fetch Error', e);
            }
        }

        // 5. Calculate Metrics
        let totalInvested = 0;
        let currentValueSum = 0;
        let totalUnrealizedPnL = 0;

        const holdings = unifiedPositions.map(pos => {
            const info = debugInfo[pos.symbol];
            const ticker = info?.ticker;

            // For EQ, we fetch via Yahoo and stored in marketQuotes mapping. 
            // For FO, we fetched via NSE and stored via ticker mapping above.
            let ltp = marketQuotes.get(ticker) || 0;

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
