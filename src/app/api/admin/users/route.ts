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

        // Fetch users alongside their portfolio balances natively
        const { data: users, error, count } = await supabase
            .from('users')
            .select(`
                id, email, created_at, role,
                portfolios ( balance, total_pnl )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // We map the related nested `portfolios` array block into a flat object for the UI table
        const formattedUsers = users.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            role: u.role,
            balance: u.portfolios?.[0]?.balance || 0,
            pnl: u.portfolios?.[0]?.total_pnl || 0
        }));

        return NextResponse.json({
            users: formattedUsers,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
