import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { symbol, qty, action, stopLoss, target } = await request.json();

        if (!symbol || !qty || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Delete existing pending exit orders for this symbol to avoid duplicates triggering
        await supabase
            .from('orders')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('user_id', session.user.id)
            .eq('symbol', symbol)
            .eq('status', 'PENDING');

        // 2. Create Stop Loss Order
        if (stopLoss) {
            const { error: slError } = await supabase.from('orders').insert({
                user_id: session.user.id,
                symbol: symbol,
                trade_type: action,
                order_type: 'SL-M', // Stop Loss Market
                qty: qty,
                filled_qty: 0,
                trigger_price: stopLoss,
                instrument_type: 'EQUITY', // Defaulting for paper trade mock
                status: 'PENDING',
                charges_breakdown: {}
            });
            if (slError) throw slError;
        }

        // 3. Create Target (Take Profit) Order
        if (target) {
            const { error: tpError } = await supabase.from('orders').insert({
                user_id: session.user.id,
                symbol: symbol,
                trade_type: action,
                order_type: 'LIMIT', // Target is effectively a limit order
                qty: qty,
                filled_qty: 0,
                requested_price: target,
                instrument_type: 'EQUITY',
                status: 'PENDING',
                charges_breakdown: {}
            });
            if (tpError) throw tpError;
        }

        return NextResponse.json({ success: true, message: 'Exit orders placed successfully' });

    } catch (error: any) {
        console.error('Modify Position API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to place exit orders' }, { status: 500 });
    }
}
