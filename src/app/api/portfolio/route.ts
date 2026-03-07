import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { mapToYahooTicker, getLotSize } from '@/lib/fo-utils';
import { aggregateOrdersToPosition } from '@/lib/pnl-engine';
import { isContractExpired } from '@/lib/expiry-engine';
import { fetchLiveQuote, setFallbackLTP } from '@/lib/market-data';

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

        // NEW ARCHITECTURE: Derive Active Positions purely from Executed Orders
        const { data: executedOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'EXECUTED')
            .order('created_at', { ascending: true }); // Process chronologically

        // 1. Group Orders by Symbol
        const orderFlowsBySymbol = new Map<string, any[]>();
        const symbolMetadata = new Map<string, any>();

        (executedOrders || []).forEach(order => {
            const uniqueKey = order.symbol;
            
            if (!orderFlowsBySymbol.has(uniqueKey)) {
                orderFlowsBySymbol.set(uniqueKey, []);
                
                const isFO = (order.instrument_type === 'OPTION' || order.instrument_type === 'FUTURE' ||
                              order.symbol.match(/[0-9]{2}[A-Z]{3}[0-9]/)) || false;

                const metadata: any = {
                    symbol: order.symbol,
                    is_fo: isFO,
                    contract_symbol: order.symbol,
                    underlying_symbol: isFO ? order.symbol.replace(/[0-9].*$/, '') : order.symbol,
                    lot_size: order.lot_size || 1, // Fallback, will be corrected later
                };

                if (isFO) {
                    const match = order.symbol.match(/^([A-Z]+)(\d{2}[A-Z]{3})(\d+)(CE|PE)$/);
                    if (match) {
                       metadata.strike_price = Number(match[3]);
                       metadata.option_type = match[4];
                       metadata.expiry_date = match[2]; 
                    }
                }
                symbolMetadata.set(uniqueKey, metadata);
            }
            orderFlowsBySymbol.get(uniqueKey)?.push(order);
        });

        // 2. Compute Net Position States Using the PnL Engine
        const positionAggregates = new Map<string, any>();
        
        for (const [symbol, orders] of orderFlowsBySymbol.entries()) {
             const state = aggregateOrdersToPosition(orders);
             const meta = symbolMetadata.get(symbol);
             positionAggregates.set(symbol, { ...state, ...meta });
        }

        // Generate unified positions array, actively dropping any instrument that currently hashes out to exactly 0 balance.
        let unifiedPositions = Array.from(positionAggregates.values()).filter(p => p.qty !== 0);

        // 3. Resolve Real Tickers & Build Fallback LTPs
        const debugInfo: any = {};
        const fallback_ltp: any = {};

        const yahooTickers = unifiedPositions.map(p => {
            let ticker = '';
            // Save the derived average entry price directly to the session registry
            setFallbackLTP(p.symbol, p.avg_price);
            fallback_ltp[p.symbol] = p.avg_price;

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
                        fallback: p.avg_price
                    };
                } else {
                    ticker = p.symbol.includes('.') ? p.symbol : `${p.symbol}.NS`;
                    debugInfo[p.symbol] = { ticker, asset_class: 'EQ', original_symbol: p.symbol, is_fo: false, fallback: p.avg_price };
                }
                return { ticker, original_symbol: p.symbol }; // Pass original symbol to use in quoting
            } catch (err) {
                console.error(`[PortfolioAPI] Error mapping ticker for ${p.symbol}:`, err);
                return null;
            }
        }).filter(t => t !== null) as { ticker: string, original_symbol: string }[];

        // 4. Batch Fetch Market Data (Strictly Yahoo for EQ/Index, NSE for Options)
        const marketQuotes = new Map();

        // 4a. Fetch Equities & Indices from Yahoo (Using our decoupled Market Data Service)
        const uniqueYahooPayloads = [...new Map(yahooTickers.filter(t => !debugInfo[t.original_symbol].is_fo).map(item => [item.ticker, item])).values()];
        
        if (uniqueYahooPayloads.length > 0) {
            await Promise.all(uniqueYahooPayloads.map(async (payload) => {
                const livePrice = await fetchLiveQuote(payload.original_symbol, false);
                marketQuotes.set(payload.ticker, livePrice);
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
                // Get NSE Session Cookies First
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
                                // Formatter for DD-MMM-YYYY
                                const dbDate = new Date(pos.expiry_date);
                                const day = String(dbDate.getDate()).padStart(2, '0');
                                const month = dbDate.toLocaleString('en-GB', { month: 'short' });
                                const year = dbDate.getFullYear();
                                const formattedExpiry = `${day}-${month}-${year}`; // e.g. 26-Mar-2025

                                const record = records.find((r: any) => Number(r.strikePrice) === Number(pos.strike_price) && (r.expiryDate === pos.expiry_date || r.expiryDate === formattedExpiry || new Date(r.expiryDate).getTime() === dbDate.getTime()));

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

        // 5. Calculate Metrics & Auto-Expire F&O Contracts
        let totalInvested = 0;
        let currentValueSum = 0;
        let totalUnrealizedPnL = 0;

        // Current IST Date String for Expiry Compares (YYYY-MM-DD)
        const nowUtc = new Date();
        const istDate = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
        const todayISTStr = istDate.toISOString().split('T')[0];

        const activeHoldings: any[] = [];

        unifiedPositions.forEach(pos => {
            // Auto-Expiration Logic (Option Contracts Only)
            if (pos.is_fo && pos.expiry_date) {
                // NSE Expirys are generally DD-MMM-YYYY or YYMMDD string format.
                // We will do a generic check if the DB Date parses gracefully.
                try {
                    const parsedExpiry = new Date(pos.expiry_date);
                    if (!isNaN(parsedExpiry.getTime())) {
                        const expiryStr = parsedExpiry.toISOString().split('T')[0];
                        if (expiryStr < todayISTStr) {
                             // Contract has expired natively! It exists in `orders` but is dead today.
                             // For now, we simply exclude it from the active `activeHoldings` UI payload.
                             // A separate Cron/Settlement engine should physically write the PnL realization to the DB.
                             return; 
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse FO Expiry for Drop", pos.expiry_date);
                }
            }

            const info = debugInfo[pos.symbol];
            const ticker = info?.ticker;

            // Fallback LTP securely inherits from the Derived Average Entry Price if external quoting fails!
            let ltp = marketQuotes.get(ticker) || fallback_ltp[pos.symbol] || pos.avg_price;

            const lotSize = pos.lot_size || getLotSize(pos.symbol);
            const totalUnits = pos.qty; // Derived dynamically

            const invested = Math.abs(pos.avg_price * totalUnits);
            const current = Math.abs(ltp * totalUnits);

            // P&L Formula: (LTP - AvgPrice) * Qty
            // Note: Qty in positions is already signed (positive for long, negative for short)
            const pnl = (ltp - pos.avg_price) * totalUnits;

            totalInvested += invested;
            currentValueSum += current;
            totalUnrealizedPnL += pnl;

            activeHoldings.push({
                ...pos,
                ltp: ltp || 0,
                ticker,
                current,
                invested,
                pnl,
                percent: invested > 0 ? (pnl / invested) * 100 : 0,
                lot_size: lotSize,
                is_live: ltp > 0,
                is_fallback: !marketQuotes.has(ticker)
            });
        });

        return NextResponse.json({
            balance: portfolio.balance,
            invested: totalInvested,
            currentValue: currentValueSum,
            realizedPnL: portfolio.total_pnl || 0,
            unrealizedPnL: totalUnrealizedPnL,
            totalPnL: (portfolio.total_pnl || 0) + totalUnrealizedPnL,
            holdings: activeHoldings,
            is_live_sync: true,
            _debug: debugInfo
        });

    } catch (error) {
        console.error('Portfolio API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
