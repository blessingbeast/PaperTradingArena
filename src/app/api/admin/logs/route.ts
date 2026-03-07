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

        const { data: logs, error, count } = await supabase
            .from('admin_logs')
            .select(`*, users!admin_logs_admin_id_fkey ( email )`, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            logs,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch logs' }, { status: 500 });
    }
}
