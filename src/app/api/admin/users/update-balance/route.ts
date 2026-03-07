import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('users').select('role, email').eq('id', session.user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { targetUserId, targetEmail, amount, type } = await request.json(); // type: 'add' | 'subtract'

        if (!targetUserId || !amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const numericAmount = Number(amount);

        // Fetch user's current portfolio balance
        const { data: portfolio } = await supabase
             .from('portfolios')
             .select('balance')
             .eq('user_id', targetUserId)
             .single();

        if (!portfolio) {
             return NextResponse.json({ error: 'User portfolio not found' }, { status: 404 });
        }

        const newBalance = type === 'add' ? portfolio.balance + numericAmount : portfolio.balance - numericAmount;

        // Perform balance update
        const { error: updateError } = await supabase
            .from('portfolios')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', targetUserId);

        if (updateError) throw updateError;

        // Commit Admin Log Trace
        const actionStr = type === 'add' ? `Admin added ₹${numericAmount.toFixed(2)} balance` : `Admin subtracted ₹${numericAmount.toFixed(2)} balance`;
        await supabase.from('admin_logs').insert({
            admin_id: session.user.id,
            action: actionStr,
            target: targetEmail || targetUserId
        });

        return NextResponse.json({ success: true, newBalance });

    } catch (e: any) {
         return NextResponse.json({ error: e.message || 'Failed to update balance' }, { status: 500 });
    }
}
