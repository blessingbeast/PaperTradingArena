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
        // Support both legacy payload (qty, type) and new F&O payload (lots, side)
        let {
            symbol, type, side, qty, lots, asset_class, order_type = 'MARKET', orderType,
            requested_price, price, trigger_price, option_type, strike_price,
            expiry_date, underlying_symbol
        } = payload;

        const tradeSide = type || side;
        const inputLots = lots || qty;
        const inputPrice = price || requested_price;
        const finalOrderType = orderType || order_type;

        if (!symbol || !tradeSide || !inputLots || inputLots <= 0) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

        const isFO = asset_class === 'FO' || asset_class === 'OPT' || symbol.match(/[0-9]{2}[A-Z]{3}[0-9]/);
        const resolvedAssetClass = isFO ? 'FO' : 'EQ';

        // 1. Validate Trading Hours (Extracted to trade-engine)
        const marketStatus = await validateMarketHours();
        if (!marketStatus.isOpen && (resolvedAssetClass === 'EQ' || resolvedAssetClass === 'FO')) {
            return NextResponse.json({ error: marketStatus.reason || 'Market Closed.' }, { status: 400 });
        }

        // 2. Fetch Live Quote Validator (Extracted to market-data)
        let marketPrice: number | null = inputPrice ? Number(inputPrice) : null;
        if (!marketPrice) {
             marketPrice = await fetchLiveQuote(symbol, isFO, underlying_symbol);
        }

        if (!marketPrice || marketPrice < 0.05) {
            return NextResponse.json({ error: `Invalid market data. Market might be closed or symbol incorrect.` }, { status: 400 });
        }

        // 3. Lot Calculation (Extracted to trade-engine)
        const parsedQty = Number(inputLots); // Technically "lots" now
        const parsedLotSize = isFO ? getLotSize(underlying_symbol || symbol) : 1;
        const totalUnits = scaleQuantity(parsedQty, parsedLotSize); // lots * lotSize

        // 4. Position Checking & Margin Lock
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).maybeSingle();
        if (!portfolio) return NextResponse.json({ error: 'Portfolio not initialized.' }, { status: 400 });

        const tradeValue = Number(marketPrice) * totalUnits;
        let requiredMargin = tradeValue;

        if (resolvedAssetClass === 'EQ' && payload.instrument_type === 'MIS') requiredMargin /= 5; 
        else if (isFO) requiredMargin = tradeSide === 'BUY' ? tradeValue : tradeValue * 2.5;

        const numericBalance = Number(portfolio.balance);
        if (requiredMargin > numericBalance * 50) return NextResponse.json({ error: 'Excessive leverage detected.' }, { status: 400 });
        if (tradeSide === 'BUY' && numericBalance < requiredMargin) return NextResponse.json({ error: `Insufficient margin.` }, { status: 400 });

        // 5. Build Instrument Schema Data
        let dbInstrumentType = 'STOCK';
        if (isFO) dbInstrumentType = option_type ? 'OPTION' : 'FUTURE';

        // 6. DB Execution (With Extended Backward Compatible F&O Schema)
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            user_id: session.user.id,
            symbol,
            trade_type: tradeSide, // Legacy backwards compatibility
            side: tradeSide, // New explicit
            order_type: finalOrderType, // Unified default
            qty: totalUnits, // Legacy total scaled fallback
            quantity: totalUnits, // New explicit derived scaling
            lots: parsedQty,
            lot_size: parsedLotSize,
            status: 'EXECUTED', // Auto-executed for paper simulator defaults
            requested_price: inputPrice || marketPrice,
            price: inputPrice || marketPrice, // New requested equivalent 
            execution_price: marketPrice, // New computed explicit execution
            filled_qty: totalUnits, // Full fills default
            instrument_type: dbInstrumentType
        }).select().single();

        if (orderError) {
            console.error("Order Supabase Insertion Error:", orderError);
            if (orderError.code === 'PGRST204' || orderError.message?.toLowerCase().includes('column')) {
                 return NextResponse.json({ success: false, message: "Order failed due to schema mismatch. Please contact admin and ensure the lot_size database migration is applied." }, { status: 500 });
            }
            return NextResponse.json({ success: false, message: orderError.message }, { status: 500 });
        }

        // Update basic raw balance. Detailed positions handled natively by PnL engine moving forward.
        const marginImpact = tradeSide === 'BUY' ? -requiredMargin : requiredMargin;
        await supabase.from('portfolios').update({
            balance: numericBalance + marginImpact,
            updated_at: new Date().toISOString()
        }).eq('user_id', session.user.id);

        return NextResponse.json({ success: true, order: orderData });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Trade failed' }, { status: 500 });
    }
}
