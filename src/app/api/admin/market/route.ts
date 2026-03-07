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
        const { data: settings, error } = await supabase.from('system_settings').select('*');
        if (error) throw error;

        // Convert the generic array map to a distinct JSON kv
        const config: Record<string, string> = {};
        settings?.forEach(s => {
             config[s.key] = s.value;
        });

        return NextResponse.json({ settings: config });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { key, value } = await request.json();
        
        if (!key || value === undefined) return NextResponse.json({ error: 'Missing configuration key/value' }, { status: 400 });

        // Upsert setting key value natively
        const { error: updateError } = await supabase
            .from('system_settings')
            .upsert({ key, value })
            .select();

        if (updateError) throw updateError;

        await supabase.from('admin_logs').insert({
            admin_id: session.user.id,
            action: `Admin modified System Runtime Configuration`,
            target: `[${key}] => ${value}`
        });

        return NextResponse.json({ success: true });

    } catch (e: any) {
         return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
