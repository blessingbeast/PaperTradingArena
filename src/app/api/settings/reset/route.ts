import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We require exact username confirmation for this destructive action
        const body = await req.json();

        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();

        if (!profile || profile.username !== body.confirmUsername) {
            return NextResponse.json({ error: 'Username confirmation does not match.' }, { status: 400 });
        }

        // Perform Wipe (Supabase RLS should allow user deletion of own data)
        await Promise.all([
            supabase.from('trades').delete().eq('user_id', user.id),
            supabase.from('orders').delete().eq('user_id', user.id),
            supabase.from('positions').delete().eq('user_id', user.id),
            supabase.from('fo_positions').delete().eq('user_id', user.id),
        ]);

        // Reset Portfolio balance back to 10 Lakhs
        await supabase.from('portfolios').update({
            balance: 1000000,
            equity: 1000000,
            invested: 0
        }).eq('user_id', user.id);

        return NextResponse.json({ success: true, message: 'Paper account fully reset to ₹10,00,000.' });
    } catch (error: any) {
        console.error("Reset Account Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
