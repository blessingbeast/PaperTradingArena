import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query = supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', session.user.id)
            .order('exit_date', { ascending: false });

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

            query = query.gte('exit_date', startDate).lte('exit_date', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Journal Fetch Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch journal entries' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, notes, emotion_tag, mistake_tag } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('journal_entries')
            .update({
                notes,
                emotion_tag,
                mistake_tag,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', session.user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Journal Update Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update journal entry' }, { status: 500 });
    }
}
