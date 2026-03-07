import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { mapToYahooTicker, getLotSize } from '@/lib/fo-utils';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await request.json();
        let {
            symbol, type, qty, asset_class, order_type = 'MARKET',
            requested_price, trigger_price, option_type, strike_price,
            expiry_date, underlying_symbol
        } = payload;

        if (!symbol || !type || !qty || qty <= 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 0. Asset Class Sanitization
        const isFO = asset_class === 'FO' || asset_class === 'OPT' || symbol.match(/[0-9]{2}[A-Z]{3}[0-9]/);
        const resolvedAssetClass = isFO ? 'FO' : 'EQ';

        // 0.5 Market Hours Validation (9:15 AM - 3:30 PM IST)
        const now = new Date();
        const utcToIstOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + utcToIstOffset);
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        
        const isMarketOpen = (hours > 9 || (hours === 9 && minutes >= 15)) &&
                             (hours < 15 || (hours === 15 && minutes <= 30));

        // Let Crypto or 24/7 mocked asset classes bypass if they exist later, 
        // but for EQ/FO strictly enforce Indian exchange hours. 
        if (!isMarketOpen && (resolvedAssetClass === 'EQ' || resolvedAssetClass === 'FO')) {
            return NextResponse.json({ error: 'Market Closed. Trading hours are 9:15 AM to 3:30 PM IST.' }, { status: 400 });
        }
        // 1. Fetch REAL Market Price (Validator)
        let marketPrice: number | null = payload.price ? Number(payload.price) : null;
        let yfTicker = '';

        if (resolvedAssetClass === 'EQ') {
            yfTicker = symbol.includes('.') ? symbol : `${symbol}.NS`;
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=1d&range=1d`, { cache: 'no-store' });
                const data = await res.json();
                const yfPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
                if (yfPrice) marketPrice = yfPrice;
            } catch (e) {
                console.error('YF Fetch Error:', e);
            }
        } else if (resolvedAssetClass === 'FO') {
            // Fetch Real Market Price for Options from NSE (Yahoo F&O deprecated)
            const nseHeaders: Record<string, string> = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.5',
            };

            let underlyingQuery = underlying_symbol || symbol.replace(/[0-9].*$/, '');
            underlyingQuery = underlyingQuery.toUpperCase();
            if (underlyingQuery === 'NIFTY') underlyingQuery = 'NIFTY';
            else if (underlyingQuery === 'BANKNIFTY') underlyingQuery = 'BANKNIFTY';
            else if (underlyingQuery === 'FINNIFTY') underlyingQuery = 'FINNIFTY';

            try {
                const baseRes = await fetch('https://www.nseindia.com', { headers: nseHeaders, next: { revalidate: 30 } });
                const cookies = baseRes.headers.get('set-cookie');
                if (cookies) nseHeaders['Cookie'] = cookies.split(',').map((c: string) => c.split(';')[0]).join('; ');

                const apiRes = await fetch(`https://www.nseindia.com/api/option-chain-indices?symbol=${underlyingQuery}`, { headers: nseHeaders, next: { revalidate: 30 } });
                if (apiRes.ok) {
                    const data = await apiRes.json();
                    const records = data.records?.data || [];

                    const targetExpiry = expiry_date; // Assumed YYYY-MM-DD
                    const targetStrike = Number(strike_price);

                    const record = records.find((r: any) => r.strikePrice === targetStrike && r.expiryDate === targetExpiry);

                    if (record) {
                        const optData = option_type === 'CE' ? record.CE : record.PE;
                        if (optData && optData.lastPrice > 0) {
                            marketPrice = optData.lastPrice;
                        }
                    }
                }
            } catch (e) {
                console.error('NSE Option Fetch Error for Trade Execution - safely falling back to client price:', e);
            }
        }

        // Validation: Block if symbol not found or price < 0.05
        if (!marketPrice || marketPrice < 0.05) {
            return NextResponse.json({
                error: `Invalid market data for ${symbol}. Market might be closed or symbol incorrect.`,
                debug_ticker: resolvedAssetClass === 'EQ' ? yfTicker : 'NSE_FO'
            }, { status: 400 });
        }

        // 2. Quantity & Lot Size Logic
        const parsedQty = Number(qty);
        const parsedLotSize = (resolvedAssetClass === 'FO') ? getLotSize(underlying_symbol || symbol) : 1;
        const totalUnits = (resolvedAssetClass === 'FO') ? (parsedQty * parsedLotSize) : parsedQty;

        // 3. Portfolio & Margin Check
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).maybeSingle();

        if (!portfolio) {
            return NextResponse.json({ error: 'Portfolio not initialized. Please visit Portfolio page first.' }, { status: 400 });
        }

        const tradeValue = Number(marketPrice) * totalUnits;
        let requiredMargin = tradeValue;

        // Security Rules: Leverage boundaries to prevent overflow manipulation
        if (resolvedAssetClass === 'EQ' && payload.instrument_type === 'MIS') {
            requiredMargin /= 5; // Max 5x for Equity Intraday
        } else if (resolvedAssetClass === 'FO') {
            if (type === 'BUY') {
                requiredMargin = tradeValue; // 1x for Options Buying (full premium)
            } else {
                requiredMargin *= 2.5; // Rough Span + Exposure for SELL (prevents naked shorts infinite leverage)
            }
        }

        const numericBalance = Number(portfolio.balance);

        if (requiredMargin > numericBalance * 50) {
            return NextResponse.json({ error: 'Trade rejected. Excessive leverage detected.' }, { status: 400 });
        }

        if (type === 'BUY' && numericBalance < requiredMargin) {
            return NextResponse.json({ error: `Insufficient margin. Required: ${requiredMargin.toFixed(2)}, Available: ${numericBalance.toFixed(2)}` }, { status: 400 });
        }

        // DB Schema Constraint logic for NOT NULL `instrument_type` field
        let dbInstrumentType = 'STOCK';
        if (resolvedAssetClass === 'FO') {
           dbInstrumentType = option_type ? 'OPTION' : 'FUTURE';
        }

        // 4. Record Order
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            user_id: session.user.id,
            symbol,
            trade_type: type,
            order_type,
            qty: totalUnits, // Store units
            status: 'EXECUTED',
            requested_price: marketPrice,
            filled_qty: totalUnits,
            instrument_type: dbInstrumentType
        }).select().single();

        if (orderError) throw orderError;

        // 5. Update Portfolio Balance
        const { error: balError } = await supabase.from('portfolios').update({
            balance: portfolio.balance - (type === 'BUY' ? tradeValue : -tradeValue)
        }).eq('id', portfolio.id);
        if (balError) throw balError;

        // Trade execution completed successfully. Positions are dynamically derived
        // from the `orders` table dynamically on the Portfolio & Header loads.

        return NextResponse.json({ success: true, order: orderData, price: marketPrice });

    } catch (error) {
        console.error('Trade API Error:', error);
        return NextResponse.json({ error: 'Execution failed: ' + (error as Error).message }, { status: 500 });
    }
}
