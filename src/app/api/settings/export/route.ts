import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's entire trade history
        const { data: trades, error } = await supabase
            .from('trades')
            .select('symbol, type, qty, price, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Generate CSV content
        let csvContent = 'Date,Symbol,Type,Quantity,Price\n';

        if (trades && trades.length > 0) {
            trades.forEach(trade => {
                const date = new Date(trade.created_at).toISOString().split('T')[0];
                const time = new Date(trade.created_at).toISOString().split('T')[1].substring(0, 8);
                const dateTime = `${date} ${time}`;
                csvContent += `"${dateTime}","${trade.symbol}","${trade.type}",${trade.qty},${trade.price}\n`;
            });
        } else {
            csvContent += 'No trades found,,,,\n';
        }

        // Return as downloadable file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="TradeHistory_${user.id.substring(0, 8)}.csv"`
            }
        });

    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to export history' }, { status: 500 });
    }
}
