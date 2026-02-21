
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get Portfolio Balance
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (portfolioError && portfolioError.code !== 'PGRST116') { // PGRST116 is no rows
            throw portfolioError;
        }

        if (!portfolio) {
            // Create portfolio if not exists (should be handled by trigger, but backup)
            // For now return defaults
            return NextResponse.json({
                balance: 100000,
                invested: 0,
                currentValue: 0,
                totalPnL: 0,
                holdings: []
            });
        }

        // 2. Get Positions
        const { data: positions, error: positionsError } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', session.user.id);

        if (positionsError) throw positionsError;

        // 3. Get Current Market Prices
        const symbols = positions.map(p => p.symbol + '.NS'); // Assuming positions store clean symbol
        let marketData: any[] = [];

        if (symbols.length > 0) {
            // Yahoo Finance quote array
            const quotes = await Promise.all(
                symbols.map(sym =>
                    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)
                        .then(r => r.json())
                        .then(d => ({
                            symbol: sym,
                            regularMarketPrice: d?.chart?.result?.[0]?.meta?.regularMarketPrice
                        }))
                        .catch(e => null)
                )
            );
            marketData = quotes.filter(q => q !== null && q.regularMarketPrice);
        }

        // 4. Calculate PnL
        let totalInvested = 0;
        let currentValue = 0;

        const holdings = positions.map(pos => {
            const quote = marketData.find(q => q.symbol === pos.symbol + '.NS' || q.symbol === pos.symbol);
            const ltp = quote ? quote.regularMarketPrice : pos.avg_price; // Fallback to avg if no quote
            const currentVal = ltp * pos.qty;
            const investedVal = pos.avg_price * pos.qty;
            const pnl = currentVal - investedVal;
            const percent = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

            totalInvested += investedVal;
            currentValue += currentVal;

            return {
                ...pos,
                ltp,
                current: currentVal,
                invested: investedVal,
                pnl,
                percent: parseFloat(percent.toFixed(2))
            };
        });

        const totalPnL = currentValue - totalInvested + (portfolio.total_pnl || 0);

        return NextResponse.json({
            balance: portfolio.balance,
            invested: totalInvested,
            currentValue: currentValue,
            realizedPnL: portfolio.total_pnl,
            unrealizedPnL: currentValue - totalInvested,
            totalPnL: (portfolio.total_pnl || 0) + (currentValue - totalInvested),
            holdings
        });

    } catch (error) {
        console.error('Portfolio API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}
