import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all trades for accurate analytics (or could accept date range)
        const { data: entries, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) throw error;

        if (!entries || entries.length === 0) {
            return NextResponse.json({
                total_trades: 0,
                win_rate: 0,
                avg_profit: 0,
                avg_loss: 0,
                max_drawdown: 0,
                total_pnl: 0,
                profit_factor: 0
            });
        }

        let winningTrades = 0;
        let totalProfit = 0;
        let totalLoss = 0;
        let losingTrades = 0;

        let peakCapital = 0;
        let runningCapital = 0;
        let maxDrawdown = 0;

        // Sort by exit date ascending for accurate drawdown calculation
        const sortedEntries = [...entries].sort((a, b) => new Date(a.exit_date).getTime() - new Date(b.exit_date).getTime());

        sortedEntries.forEach(trade => {
            const pnl = Number(trade.pnl);

            // Win/Loss metrics
            if (pnl > 0) {
                winningTrades++;
                totalProfit += pnl;
            } else if (pnl < 0) {
                losingTrades++;
                totalLoss += Math.abs(pnl);
            }

            // Drawdown calculation
            runningCapital += pnl;
            if (runningCapital > peakCapital) {
                peakCapital = runningCapital;
            }
            const currentDrawdown = peakCapital - runningCapital;
            if (currentDrawdown > maxDrawdown) {
                maxDrawdown = currentDrawdown;
            }
        });

        const totalTrades = winningTrades + losingTrades; // Ignoring breakeven for win rate denom generally, or use entries.length
        const totalClosedTrades = entries.length;

        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const avgProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
        const totalPnl = totalProfit - totalLoss;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? 999 : 0);

        return NextResponse.json({
            total_trades: totalClosedTrades,
            total_pnl: totalPnl,
            win_rate: winRate,
            avg_profit: avgProfit,
            avg_loss: avgLoss,
            max_drawdown: maxDrawdown,
            profit_factor: profitFactor
        });

    } catch (error: any) {
        console.error('Journal Analytics Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to calculate analytics' }, { status: 500 });
    }
}
