import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getLotSize } from '@/lib/fo-utils';
import { validateMarketHours, scaleQuantity } from '@/lib/trade-engine';
import { fetchLiveQuote } from '@/lib/market-data';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const payload = await request.json();
        let {
            symbol, type, qty, asset_class, order_type = 'MARKET',
            requested_price, trigger_price, option_type, strike_price,
            expiry_date, underlying_symbol
        } = payload;

        if (!symbol || !type || !qty || qty <= 0) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

        const isFO = asset_class === 'FO' || asset_class === 'OPT' || symbol.match(/[0-9]{2}[A-Z]{3}[0-9]/);
        const resolvedAssetClass = isFO ? 'FO' : 'EQ';

        // 1. Validate Trading Hours (Extracted to trade-engine)
        const marketStatus = await validateMarketHours();
        if (!marketStatus.isOpen && (resolvedAssetClass === 'EQ' || resolvedAssetClass === 'FO')) {
            return NextResponse.json({ error: marketStatus.reason || 'Market Closed.' }, { status: 400 });
        }

        // 2. Fetch Live Quote Validator (Extracted to market-data)
        let marketPrice: number | null = payload.price ? Number(payload.price) : null;
        if (!marketPrice) {
             marketPrice = await fetchLiveQuote(symbol, isFO, underlying_symbol);
        }

        if (!marketPrice || marketPrice < 0.05) {
            return NextResponse.json({ error: `Invalid market data. Market might be closed or symbol incorrect.` }, { status: 400 });
        }

        // 3. Lot Calculation (Extracted to trade-engine)
        const parsedQty = Number(qty);
        const parsedLotSize = isFO ? getLotSize(underlying_symbol || symbol) : 1;
        const totalUnits = scaleQuantity(parsedQty, parsedLotSize);

        // 4. Position Checking & Margin Lock
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).maybeSingle();
        if (!portfolio) return NextResponse.json({ error: 'Portfolio not initialized.' }, { status: 400 });

        const tradeValue = Number(marketPrice) * totalUnits;
        let requiredMargin = tradeValue;

        if (resolvedAssetClass === 'EQ' && payload.instrument_type === 'MIS') requiredMargin /= 5; 
        else if (isFO) requiredMargin = type === 'BUY' ? tradeValue : tradeValue * 2.5;

        const numericBalance = Number(portfolio.balance);
        if (requiredMargin > numericBalance * 50) return NextResponse.json({ error: 'Excessive leverage detected.' }, { status: 400 });
        if (type === 'BUY' && numericBalance < requiredMargin) return NextResponse.json({ error: `Insufficient margin.` }, { status: 400 });

        // 5. Build Instrument Schema Data
        let dbInstrumentType = 'STOCK';
        if (isFO) dbInstrumentType = option_type ? 'OPTION' : 'FUTURE';

        // 6. DB Execution
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            user_id: session.user.id,
            symbol,
            trade_type: type,
            order_type,
            qty: totalUnits,
            status: 'EXECUTED',
            requested_price: marketPrice,
            filled_qty: totalUnits,
            instrument_type: dbInstrumentType,
            lot_size: parsedLotSize
        }).select().single();

        if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

        // Update basic raw balance. Detailed positions handled natively by PnL engine moving forward.
        const marginImpact = type === 'BUY' ? -requiredMargin : requiredMargin;
        await supabase.from('portfolios').update({
            balance: numericBalance + marginImpact,
            updated_at: new Date().toISOString()
        }).eq('user_id', session.user.id);

        return NextResponse.json({ success: true, order: orderData });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Trade failed' }, { status: 500 });
    }
}
