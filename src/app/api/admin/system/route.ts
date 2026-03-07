import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Enforce Admin Server-Side
    const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const [usersReq, ordersReq, activePosReq, settingsReq] = await Promise.all([
            // Supabase COUNT queries
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            // To find 'Active' positions we'd normally group net qty by symbol, but counting raw open 'orders' loosely tracks platform scale.
            supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['EXECUTED', 'PENDING']),
            supabase.from('system_settings').select('*')
        ]);

        const marketOpenSetting = settingsReq.data?.find(s => s.key === 'market_open')?.value === 'true';

        return NextResponse.json({
            totalUsers: usersReq.count || 0,
            totalOrders: ordersReq.count || 0,
            activePositionsEstimate: activePosReq.count || 0, // In dynamic PnL architectures, open positions = filled execution logs
            systemStatus: marketOpenSetting ? 'Active' : 'Halted'
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch admin stats' }, { status: 500 });
    }
}
