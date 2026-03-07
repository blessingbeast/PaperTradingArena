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
        // We'll query across primary databases sequentially to map out a system snapshot
        const [usersReq, portfoliosReq, ordersReq] = await Promise.all([
            // Supabase COUNT queries
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('portfolios').select('balance, total_pnl'),
            supabase.from('orders').select('qty, requested_price, status')
        ]);

        const totalUsers = usersReq.count || 0;
        const totalOrders = ordersReq.data?.length || 0;
        
        let globalPlatformCapital = 0;
        let globalPlatformRealizedPnL = 0;

        portfoliosReq.data?.forEach(port => {
            globalPlatformCapital += Number(port.balance || 0);
            globalPlatformRealizedPnL += Number(port.total_pnl || 0);
        });

        // Calculate Trading Volume globally based on (Qty * Price) executed.
        let volumeInvested = 0;
        ordersReq.data?.filter(o => o.status === 'EXECUTED').forEach((order) => {
            volumeInvested += Number(order.qty || 0) * Number(order.requested_price || 0);
        });

        return NextResponse.json({
            metrics: {
                totalUsers,
                totalOrders,
                globalPlatformCapital,
                globalPlatformRealizedPnL,
                volumeInvested
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch complex analytics' }, { status: 500 });
    }
}
