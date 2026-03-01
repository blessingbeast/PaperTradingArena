import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { order_id, executed_price } = await request.json();

        if (!order_id || !executed_price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the exact pending order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .eq('user_id', session.user.id)
            .eq('status', 'PENDING')
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Pending order not found or already executed.' }, { status: 404 });
        }

        // 2. Fetch Portfolio & Existing Position for margin math
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).single();
        const { data: existingPosition } = await supabase.from('positions').select('*').eq('user_id', session.user.id).eq('symbol', order.symbol).single();

        if (!portfolio) throw new Error('Portfolio not found');

        const leverage = order.instrument_type === 'MIS' ? 5 : 1;
        const currentQty = existingPosition ? existingPosition.qty : 0;
        const currentAvg = existingPosition ? existingPosition.avg_price : 0;
        const entryLeverage = existingPosition && existingPosition.instrument_type === 'MIS' ? 5 : 1;

        let coverQty = 0;
        let newPosQty = 0;
        let realizedPnL = 0;
        let marginReleased = 0;
        let marginRequired = 0;

        const qty = order.qty;
        const netOrderQty = order.trade_type === 'BUY' ? qty : -qty;
        const newTotalQty = currentQty + netOrderQty;

        if (order.trade_type === 'BUY') {
            if (currentQty < 0) { // Covering short
                coverQty = Math.min(Math.abs(currentQty), qty);
                newPosQty = qty - coverQty;
                realizedPnL = (currentAvg - executed_price) * coverQty;
                marginReleased = (currentAvg * coverQty) / entryLeverage;
            } else {
                newPosQty = qty; // Pure long
            }
        } else { // SELL
            if (currentQty > 0) { // Closing long
                coverQty = Math.min(currentQty, qty);
                newPosQty = qty - coverQty;
                realizedPnL = (executed_price - currentAvg) * coverQty;
                marginReleased = (currentAvg * coverQty) / entryLeverage;
            } else {
                newPosQty = qty; // Pure short
            }
        }

        marginRequired = (executed_price * newPosQty) / leverage;

        // Simplified Brokerage calc for execution
        const tradeValue = executed_price * qty;
        const exchangeReqCharges = tradeValue * 0.0000345;
        let brokerage = 0, stt = 0;
        if (order.instrument_type === 'MIS') {
            brokerage = Math.min(tradeValue * 0.0003, 20);
            stt = order.trade_type === 'SELL' ? tradeValue * 0.00025 : 0;
        } else {
            stt = tradeValue * 0.001;
        }
        const totalCharges = brokerage + stt + exchangeReqCharges + ((brokerage + exchangeReqCharges) * 0.18);

        const balanceImpact = marginReleased + realizedPnL - marginRequired - totalCharges;

        if (balanceImpact < 0 && portfolio.balance < Math.abs(balanceImpact)) {
            await supabase.from('orders').update({ status: 'REJECTED', rejection_reason: 'Insufficient Margin' }).eq('id', order.id);
            return NextResponse.json({ error: 'Insufficient Margin at execution time' }, { status: 400 });
        }

        // 3. Execute Updates Transactionally (Simulated)
        const newBalance = portfolio.balance + balanceImpact;
        const newTotalPnL = (portfolio.total_pnl || 0) + realizedPnL;

        await supabase.from('portfolios').update({ balance: newBalance, total_pnl: newTotalPnL }).eq('user_id', session.user.id);

        if (newTotalQty === 0) {
            if (existingPosition) await supabase.from('positions').delete().eq('id', existingPosition.id);
        } else {
            let newAvgPrice = executed_price;
            if (existingPosition && Math.sign(currentQty) === Math.sign(newTotalQty)) {
                const currentVal = currentAvg * Math.abs(currentQty);
                const newVal = executed_price * Math.abs(netOrderQty);
                newAvgPrice = (currentVal + newVal) / Math.abs(newTotalQty);
            }

            if (existingPosition) {
                await supabase.from('positions').update({ qty: newTotalQty, avg_price: newAvgPrice, updated_at: new Date() }).eq('id', existingPosition.id);
            } else {
                await supabase.from('positions').insert({ user_id: session.user.id, symbol: order.symbol, qty: newTotalQty, avg_price: newAvgPrice, instrument_type: order.instrument_type });
            }
        }

        if (coverQty > 0 && existingPosition) {
            await supabase.from('journal_entries').insert({
                user_id: session.user.id,
                symbol: order.symbol,
                entry_date: existingPosition.created_at,
                exit_date: new Date().toISOString(),
                entry_price: existingPosition.avg_price,
                exit_price: executed_price,
                qty: coverQty,
                side: order.trade_type === 'SELL' ? 'LONG' : 'SHORT',
                pnl: realizedPnL - (totalCharges * (coverQty / qty))
            });
        }

        await supabase.from('trades').insert({
            user_id: session.user.id,
            symbol: order.symbol,
            type: order.trade_type,
            qty,
            price: executed_price,
            instrument_type: order.instrument_type,
        });

        await supabase.from('orders').update({
            status: 'EXECUTED',
            filled_qty: qty,
            executed_price: executed_price,
            updated_at: new Date()
        }).eq('id', order.id);

        // Cancel siblings (if target hits, cancel SL. If SL hits, cancel target for same symbol)
        await supabase.from('orders').update({ status: 'CANCELLED' })
            .eq('user_id', session.user.id)
            .eq('symbol', order.symbol)
            .eq('status', 'PENDING')
            .neq('id', order.id);

        return NextResponse.json({ success: true, message: `Order executed at ${executed_price}` });

    } catch (error: any) {
        console.error('Execute Pending API Error:', error);
        return NextResponse.json({ error: error.message || 'Execution Failed' }, { status: 500 });
    }
}
