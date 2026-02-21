import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { error } = await supabase.from('watchlists').select('id').limit(1);

    if (error) {
        return NextResponse.json({ exists: false, error: error.message });
    }
    return NextResponse.json({ exists: true });
}
