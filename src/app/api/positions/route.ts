import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { aggregateOrdersToPosition } from '@/lib/pnl-engine';
import { getLotSize } from '@/lib/fo-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // ============================================================
        // STEP 1: Fetch ALL orders (no status filter) to see everything
        // We'll filter out only cancelled/rejected in code
        // ============================================================
        const { data: allOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

        if (ordersError) {
            console.error('[positions] DB error:', ordersError);
            return NextResponse.json({ positions: [], _debug: { error: ordersError.message } });
        }

        if (!allOrders || allOrders.length === 0) {
            return NextResponse.json({ positions: [], _debug: { total_orders: 0, message: 'No orders found' } });
        }

        // Debug: collect unique statuses to diagnose filter issues
        const statusCounts: Record<string, number> = {};
        allOrders.forEach(o => {
            const s = String(o.status ?? 'null');
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        // ============================================================
        // STEP 2: Filter to only "executed" orders (broad match)
        // Exclude CANCELLED and REJECTED. Accept everything else.
        // ============================================================
        const EXCLUDED_STATUSES = ['CANCELLED', 'cancelled', 'REJECTED', 'rejected', 'CANCELED', 'canceled'];
        const executedOrders = allOrders.filter(o => {
            const status = String(o.status ?? '').toUpperCase();
            return !EXCLUDED_STATUSES.includes(status.trim());
        });

        // ============================================================
        // STEP 3: Group by symbol
        // ============================================================
        const grouped = new Map<string, any[]>();
        for (const order of executedOrders) {
            const key = order.symbol;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(order);
        }

        const positions: any[] = [];

        for (const [symbol, symbolOrders] of grouped.entries()) {
            const state = aggregateOrdersToPosition(symbolOrders);
            
            // Skip flat/closed positions (qty = 0)
            if (state.qty === 0) continue;
            // Note: DO NOT skip avg_price === 0 — that would hide legitimate positions

            const firstOrder = symbolOrders[0];
            
            // ============================================================
            // STEP 4: Detect instrument type
            // ============================================================
            const instType = (firstOrder.instrument_type || '').toUpperCase();
            const isFO = (
                instType === 'OPTION' ||
                instType === 'FUTURE' ||
                instType === 'FNO' ||
                /\d{2}[A-Z]{3}\d/.test(symbol)
            );

            // ============================================================
            // STEP 5: Parse F&O metadata from symbol with robust regex
            // NSE format: UNDERLYING + DD + MMM + [YY] + STRIKE + CE/PE
            // Examples: NIFTY26MAR23500CE, NIFTY26MAR2623500CE, BANKNIFTY26MAR2653000PE
            // ============================================================
            let strike_price: number | null = null;
            let option_type: string | null = null;
            let expiry_date: string | null = null;
            let underlying_symbol = symbol;
            let is_option = false;
            let is_future = false;

            if (isFO) {
                underlying_symbol = symbol.replace(/\d{2}[A-Z]{3}.*$/, '');

                // Try option pattern first
                const optMatch = symbol.match(/^([A-Z]+)(\d{2}[A-Z]{3})(\d{2})?(\d{3,6})(CE|PE)$/i);
                if (optMatch) {
                    is_option = true;
                    expiry_date = optMatch[2] + (optMatch[3] || '');
                    strike_price = Number(optMatch[4]);
                    option_type = optMatch[5].toUpperCase();
                } else {
                    // Try futures pattern
                    const futMatch = symbol.match(/^([A-Z]+)(\d{2}[A-Z]{3})(\d{2})?FUT$/i);
                    if (futMatch) {
                        is_future = true;
                        expiry_date = futMatch[2] + (futMatch[3] || '');
                    }
                }
            }

            // ============================================================
            // STEP 6: LTP — use avg_price as fallback (safe, never 0 crash)
            // ============================================================
            const ltp = state.avg_price > 0 ? state.avg_price : 0;
            const lotSize = firstOrder.lot_size || getLotSize(symbol) || 1;
            const unrealizedPnL = 0; // Will be updated by live market data hooks in portfolio

            positions.push({
                symbol,
                instrument_type: firstOrder.instrument_type || (is_option ? 'OPTION' : is_future ? 'FUTURE' : 'STOCK'),
                is_fo: isFO,
                is_option,
                is_future,
                underlying_symbol,
                qty: state.qty,
                lots: lotSize > 1 ? Math.round(Math.abs(state.qty) / lotSize * 10) / 10 : Math.abs(state.qty),
                lot_size: lotSize,
                avg_price: state.avg_price,
                ltp,
                unrealized_pnl: unrealizedPnL,
                invested: Math.abs((state.avg_price || 0) * state.qty),
                current_value: Math.abs(ltp * state.qty),
                entry_time: state.entry_time,
                strike_price,
                option_type,
                expiry_date,
            });
        }

        // Sort: F&O first, then equities
        positions.sort((a, b) => (b.is_fo ? 1 : 0) - (a.is_fo ? 1 : 0));

        return NextResponse.json({
            positions,
            count: positions.length,
            _debug: {
                total_orders: allOrders.length,
                executed_orders: executedOrders.length,
                status_distribution: statusCounts,
                symbols: [...grouped.keys()],
            }
        });

    } catch (err: any) {
        console.error('[positions] Unexpected error:', err);
        return NextResponse.json({ positions: [], _debug: { error: err.message } }, { status: 200 });
    }
}
