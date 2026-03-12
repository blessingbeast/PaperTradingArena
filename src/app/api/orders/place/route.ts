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
        const {
            symbol, type, side, qty, lots, asset_class, order_type = 'MARKET', orderType,
            requested_price, price, trigger_price, option_type, strike_price,
            expiry_date, underlying_symbol
        } = payload;

        const tradeSide = type || side;
        const inputLots = lots || qty;
        const inputPrice = price || requested_price;
        const finalOrderType = orderType || order_type;

        if (!symbol || !tradeSide || !inputLots || Number(inputLots) <= 0) {
            return NextResponse.json({ error: 'Invalid input: symbol, type and qty/lots are required.' }, { status: 400 });
        }

        const isFO = asset_class === 'FO' || asset_class === 'OPT' || /[0-9]{2}[A-Z]{3}[0-9]/.test(symbol);
        const resolvedAssetClass = isFO ? 'FO' : 'EQ';

        // 1. Validate Trading Hours
        const marketStatus = await validateMarketHours();
        if (!marketStatus.isOpen) {
            return NextResponse.json({ error: marketStatus.reason || 'Market Closed.' }, { status: 400 });
        }

        // 2. Fetch Live Quote
        let marketPrice: number | null = inputPrice ? Number(inputPrice) : null;
        if (!marketPrice) {
            marketPrice = await fetchLiveQuote(symbol, isFO, underlying_symbol);
        }
        if (!marketPrice || marketPrice < 0.05) {
            return NextResponse.json({ error: 'Invalid market data. Market might be closed or symbol incorrect.' }, { status: 400 });
        }

        // 3. Lot / Quantity Calculation
        // For F&O: actualQuantity = lots * lotSize
        // For Equity: actualQuantity = qty (no lot multiplier)
        const parsedLots = Number(inputLots);
        const parsedLotSize: number = isFO ? (getLotSize(underlying_symbol || symbol) ?? 1) : 1;
        const totalUnits = scaleQuantity(parsedLots, parsedLotSize); // lots * lotSize

        // 4. Portfolio & Margin Check
        const { data: portfolio } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (!portfolio) return NextResponse.json({ error: 'Portfolio not initialized.' }, { status: 400 });

        const tradeValue = marketPrice * totalUnits;
        let requiredMargin = tradeValue;
        if (resolvedAssetClass === 'EQ' && payload.instrument_type === 'MIS') requiredMargin /= 5;
        else if (isFO) requiredMargin = tradeSide === 'BUY' ? tradeValue : tradeValue * 2.5;

        const numericBalance = Number(portfolio.balance);
        if (requiredMargin > numericBalance * 50) return NextResponse.json({ error: 'Excessive leverage detected.' }, { status: 400 });
        if (tradeSide === 'BUY' && numericBalance < requiredMargin) return NextResponse.json({ error: 'Insufficient margin.' }, { status: 400 });

        // 5. Instrument type classification
        let dbInstrumentType = 'STOCK';
        if (isFO) dbInstrumentType = option_type ? 'OPTION' : 'FUTURE';

        // 6a. Build the full insert payload (assumes migrated schema)
        const fullInsertPayload = {
            user_id: session.user.id,
            symbol,
            trade_type: tradeSide,
            order_type: finalOrderType,
            qty: totalUnits,
            filled_qty: totalUnits,
            status: 'EXECUTED',
            requested_price: marketPrice,
            instrument_type: dbInstrumentType,
            // Extended F&O schema columns (require migration)
            lot_size: parsedLotSize,
            lots: parsedLots,
            quantity: totalUnits,
            execution_price: marketPrice,
        };

        let orderData: any = null;
        let orderError: any = null;

        // 6b. Try full insert first
        const fullResult = await supabase.from('orders').insert(fullInsertPayload).select().single();
        orderData = fullResult.data;
        orderError = fullResult.error;

        // 6c. Graceful Fallback: if schema columns missing, retry with only legacy columns
        if (orderError && (orderError.code === 'PGRST204' || orderError.message?.includes('column'))) {
            console.warn('Extended columns missing from orders table — falling back to legacy insert. Run the SQL migration to unlock full F&O data.');
            const legacyResult = await supabase.from('orders').insert({
                user_id: session.user.id,
                symbol,
                trade_type: tradeSide,
                order_type: finalOrderType,
                qty: totalUnits,
                filled_qty: totalUnits,
                status: 'EXECUTED',
                requested_price: marketPrice,
                instrument_type: dbInstrumentType,
            }).select().single();

            orderData = legacyResult.data;
            orderError = legacyResult.error;
        }

        if (orderError) {
            console.error('Order insertion failed:', orderError);
            return NextResponse.json({ success: false, message: orderError.message || 'Order insertion failed.' }, { status: 500 });
        }

        // 7. Update portfolio balance
        const marginImpact = tradeSide === 'BUY' ? -requiredMargin : requiredMargin;
        await supabase.from('portfolios').update({
            balance: numericBalance + marginImpact,
            updated_at: new Date().toISOString()
        }).eq('user_id', session.user.id);

        return NextResponse.json({ success: true, order: orderData });

    } catch (error: any) {
        console.error('Trade failed:', error);
        return NextResponse.json({ error: error.message || 'Trade failed' }, { status: 500 });
    }
}
