import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 50; 
        const offset = (page - 1) * limit;

        const { data: orders, error, count } = await supabase
            .from('orders')
            .select(`
                *,
                users ( email )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            orders,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('id');

        if (!orderId) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });

        // Retrieve Order Info First For Logging
        const { data: targetOrder } = await supabase.from('orders').select('user_id, symbol').eq('id', orderId).single();

        const { error: cancelError } = await supabase
            .from('orders')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('id', orderId)
            // Admins can force cancel globally, we just strictly require the target order exists and is pending!
            .in('status', ['PENDING']); 

        if (cancelError) throw cancelError;

        // Log action
        await supabase.from('admin_logs').insert({
            admin_id: session.user.id,
            action: `Admin Force Cancelled Order ${orderId.split('-')[0]}`,
            target: targetOrder ? `User: ${targetOrder.user_id} | Symbol: ${targetOrder.symbol}` : 'Unknown'
        });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
