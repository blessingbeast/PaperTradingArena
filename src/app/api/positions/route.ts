import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { aggregateOrdersToPosition } from '@/lib/pnl-engine';
import { getLotSize } from '@/lib/fo-utils';
import { fetchLiveQuote } from '@/lib/market-data';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch ALL orders regardless of status case
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .or('status.eq.EXECUTED,status.eq.executed,status.eq.Executed,status.eq.FILLED,status.eq.filled')
            .order('created_at', { ascending: true });

        if (ordersError) {
            console.error('[positions] DB error:', ordersError);
            return NextResponse.json({ positions: [] });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ positions: [] });
        }

        // Group by symbol
        const grouped = new Map<string, any[]>();
        for (const order of orders) {
            const key = order.symbol;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(order);
        }

        const positions: any[] = [];

        for (const [symbol, symbolOrders] of grouped.entries()) {
            const state = aggregateOrdersToPosition(symbolOrders);
            
            // Skip flat/closed positions
            if (state.qty === 0 || state.avg_price === 0) continue;

            const firstOrder = symbolOrders[0];
            const isFO = (
                firstOrder.instrument_type === 'OPTION' ||
                firstOrder.instrument_type === 'FUTURE' ||
                firstOrder.instrument_type === 'FNO' ||
                /\d{2}[A-Z]{3}\d/.test(symbol)
            );

            // Parse F&O metadata from symbol string
            let strike_price: number | null = null;
            let option_type: string | null = null;
            let expiry_date: string | null = null;
            let underlying_symbol = symbol;

            if (isFO) {
                underlying_symbol = symbol.replace(/\d{2}[A-Z]{3}.*$/, '');
                // Handles: NIFTY26MAR23850CE and NIFTY26MAR2623850CE
                const match = symbol.match(/^([A-Z]+)(\d{2}[A-Z]{3})(\d{2})?(\d{4,6})(CE|PE)$/);
                if (match) {
                    strike_price = Number(match[4]);
                    option_type = match[5];
                    expiry_date = match[2] + (match[3] || '');
                }
            }

            // Fetch LTP with safe fallback — never let this crash the whole response
            let ltp = state.avg_price; // safe fallback always = avg_price
            try {
                const fetchedPrice = await fetchLiveQuote(symbol, isFO, underlying_symbol);
                if (fetchedPrice && fetchedPrice > 0.01) ltp = fetchedPrice;
            } catch {
                // silently use avg_price as LTP
            }

            const lotSize = firstOrder.lot_size || getLotSize(symbol) || 1;
            const unrealizedPnL = (ltp - state.avg_price) * state.qty;

            positions.push({
                symbol,
                instrument_type: firstOrder.instrument_type || (isFO ? 'OPTION' : 'STOCK'),
                is_fo: isFO,
                underlying_symbol,
                qty: state.qty,                    // Net signed quantity
                lots: Math.abs(state.qty) / lotSize,
                lot_size: lotSize,
                avg_price: state.avg_price,
                ltp,
                unrealized_pnl: unrealizedPnL,
                invested: Math.abs(state.avg_price * state.qty),
                current_value: Math.abs(ltp * state.qty),
                entry_time: state.entry_time,
                // F&O metadata
                strike_price,
                option_type,
                expiry_date,
                // Holding duration
                holding_since: state.entry_time
                    ? Math.floor((Date.now() - new Date(state.entry_time).getTime()) / 60000)
                    : null,
            });
        }

        return NextResponse.json({ positions, count: positions.length });

    } catch (err: any) {
        console.error('[positions] Unexpected error:', err);
        return NextResponse.json({ positions: [], error: err.message }, { status: 500 });
    }
}
