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

        // 0.5 Market Hours validation removed for Paper Trading testing flexibility.

        // 1. Fetch REAL Market Price (Validator)
        let yfTicker = '';
        if (resolvedAssetClass === 'FO') {
            let underlying = underlying_symbol || symbol.replace(/[0-9].*$/, '');
            if (underlying === 'NIFTY') yfTicker = '^NSEI';
            else if (underlying === 'BANKNIFTY') yfTicker = '^NSEBANK';
            else if (underlying === 'FINNIFTY') yfTicker = '^CNXFIN';
            else yfTicker = underlying.includes('.') ? underlying : `${underlying}.NS`;
        } else {
            yfTicker = symbol.includes('.') ? symbol : `${symbol}.NS`;
        }

        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=1d&range=1d`, { cache: 'no-store' });
        const data = await res.json();
        let marketPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

        // Fetch Real Market Price for Options from NSE (Yahoo F&O deprecated)
        if (resolvedAssetClass === 'FO') {
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

                    const targetExpiry = expiry_date; // Assuming YYYY-MM-DD matches NSE format from fo-utils
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
                console.error('NSE Option Fetch Error for Trade Execution:', e);
            }
        }

        // Validation: Block if symbol not found or price < 0.05 (NSE minimum tick)
        if (!marketPrice || marketPrice < 0.05) {
            return NextResponse.json({
                error: `Invalid market data for ${symbol}. Market might be closed or symbol incorrect.`,
                debug_ticker: yfTicker
            }, { status: 400 });
        }

        // 2. Quantity & Lot Size Logic
        const lotSize = (resolvedAssetClass === 'FO') ? getLotSize(underlying_symbol || symbol) : 1;
        const totalUnits = (resolvedAssetClass === 'FO') ? (qty * lotSize) : qty;

        // 3. Portfolio & Margin Check
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).maybeSingle();

        if (!portfolio) {
            // Auto-initialize portfolio if missing? 
            // For now, block with clear error or use a default
            return NextResponse.json({ error: 'Portfolio not initialized. Please visit Portfolio page first.' }, { status: 400 });
        }

        const tradeValue = marketPrice * totalUnits;
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

        if (requiredMargin > portfolio.balance * 50) {
            return NextResponse.json({ error: 'Trade rejected. Excessive leverage detected.' }, { status: 400 });
        }

        if (type === 'BUY' && portfolio.balance < requiredMargin) {
            return NextResponse.json({ error: 'Insufficient margin' }, { status: 400 });
        }

        // 4. Record Order
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            user_id: session.user.id,
            symbol,
            trade_type: type,
            order_type,
            qty: totalUnits, // Store units
            lot_size: lotSize,
            status: 'EXECUTED',
            requested_price: marketPrice,
            filled_qty: totalUnits,
            asset_class: resolvedAssetClass
        }).select().single();

        if (orderError) throw orderError;

        // 5. Update Portfolio Balance
        const { error: balError } = await supabase.from('portfolios').update({
            balance: portfolio.balance - (type === 'BUY' ? tradeValue : -tradeValue)
        }).eq('id', portfolio.id);
        if (balError) throw balError;

        // 6. Update Position
        const table = resolvedAssetClass === 'EQ' ? 'positions' : 'fo_positions';
        const query = supabase.from(table).select('*').eq('user_id', session.user.id);
        if (resolvedAssetClass === 'EQ') query.eq('symbol', symbol);
        else query.eq('contract_symbol', symbol);

        const { data: existingPos } = await query.maybeSingle();
        const netQty = type === 'BUY' ? totalUnits : -totalUnits;

        if (existingPos) {
            const newQty = (existingPos.qty || 0) + netQty;
            if (newQty === 0) {
                await supabase.from(table).delete().eq('id', existingPos.id);
            } else {
                const newAvg = (existingPos.avg_price * existingPos.qty + marketPrice * netQty) / newQty;
                await supabase.from(table).update({
                    qty: newQty,
                    avg_price: Math.abs(newAvg)
                }).eq('id', existingPos.id);
            }
        } else {
            const insertPayload: any = {
                user_id: session.user.id,
                qty: netQty,
                avg_price: marketPrice,
                lot_size: lotSize
            };
            if (resolvedAssetClass === 'EQ') {
                insertPayload.symbol = symbol;
                insertPayload.instrument_type = payload.instrument_type || 'CNC';
            } else {
                insertPayload.contract_symbol = symbol;
                insertPayload.underlying_symbol = underlying_symbol || symbol;
                insertPayload.option_type = option_type;
                insertPayload.strike_price = strike_price;
                insertPayload.expiry_date = expiry_date;
            }
            await supabase.from(table).insert(insertPayload);
        }

        return NextResponse.json({ success: true, order: orderData, price: marketPrice });

    } catch (error) {
        console.error('Trade API Error:', error);
        return NextResponse.json({ error: 'Execution failed: ' + (error as Error).message }, { status: 500 });
    }
}
