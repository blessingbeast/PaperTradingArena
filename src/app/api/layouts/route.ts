import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'global';

    try {
        const { data, error } = await supabase
            .from('chart_layouts')
            .select('layout_data')
            .eq('user_id', session.user.id)
            .eq('symbol', symbol)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json(data ? data.layout_data : {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { symbol = 'global', layout_data } = body;

        if (!layout_data) return NextResponse.json({ error: 'Layout data required' }, { status: 400 });

        // Upsert logic
        const { data: existing } = await supabase
            .from('chart_layouts')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('symbol', symbol)
            .maybeSingle();

        if (existing) {
            const { error: updateError } = await supabase
                .from('chart_layouts')
                .update({ layout_data, updated_at: new Date() })
                .eq('id', existing.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('chart_layouts')
                .insert({ user_id: session.user.id, symbol, layout_data });
            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
