import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { aggregateOrdersToPosition } from '@/lib/pnl-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        // Fetch all EXECUTED orders globally to derive active positions
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`*, users ( email )`)
            .eq('status', 'EXECUTED')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Group orders by User ID AND Symbol natively to isolate distinct portfolio lines
        const positionMap = new Map<string, any[]>();
        
        orders.forEach(order => {
             const key = `${order.user_id}_${order.symbol}`;
             if (!positionMap.has(key)) positionMap.set(key, []);
             positionMap.get(key)?.push(order);
        });

        const activePositions: any[] = [];

        // Distill arrays using the mathematically proven Phase 9 PnL Engine
        for (const [key, userOrders] of positionMap.entries()) {
             const state = aggregateOrdersToPosition(userOrders);
             if (state.qty !== 0) {
                 // It's an open active position
                 activePositions.push({
                     user_id: userOrders[0].user_id,
                     email: userOrders[0].users?.email || 'Unknown',
                     symbol: state.symbol,
                     net_qty: state.qty,
                     avg_price: state.avg_price,
                     entry_time: state.entry_time
                 });
             }
        }

        return NextResponse.json({
            positions: activePositions,
            totalActive: activePositions.length
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
