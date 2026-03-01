import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getLotSize } from '@/lib/fo-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: portfolio } = await supabase.from('portfolios').select('*').eq('user_id', session.user.id).single();
        if (!portfolio) throw new Error('Portfolio not found');

        // 1. Fetch Open F&O Positions
        const { data: foPositions } = await supabase.from('fo_positions').select('*').eq('user_id', session.user.id);
        if (!foPositions || foPositions.length === 0) {
            return NextResponse.json({ success: true, settledCount: 0 });
        }

        // 2. Identify Expired Positions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredPositions = foPositions.filter(pos => {
            if (!pos.expiry_date) return false;
            const expiry = new Date(pos.expiry_date);
            expiry.setHours(0, 0, 0, 0);
            return expiry < today; // Strictly before today
        });

        if (expiredPositions.length === 0) {
            return NextResponse.json({ success: true, settledCount: 0 });
        }

        let settledCount = 0;
        let totalBalanceImpact = 0;
        let totalPnLImpact = 0;

        // 3. Process Each Expired Position
        for (const pos of expiredPositions) {
            const underlying = pos.underlying_symbol || pos.contract_symbol.replace(/\d.*$/, '');
            let yfUnderlying = underlying;
            if (underlying === 'NIFTY') yfUnderlying = '^NSEI';
            else if (underlying === 'BANKNIFTY') yfUnderlying = '^NSEBANK';
            else if (!yfUnderlying.includes('.')) yfUnderlying += '.NS';

            // Fetch current/historical underlying price
            let underlyingPrice = 0;
            try {
                // Fetch recent days to get the close price around expiry
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfUnderlying}?interval=1d&range=5d`, { cache: 'no-store' });
                const data = await res.json();

                // For simplicity, we settle at the LAST known underlying price. 
                // A perfect system would match exact expiry date closing price.
                underlyingPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
            } catch (err) {
                console.error(`Failed to fetch underlying for settlement: ${yfUnderlying}`);
                continue; // Skip this one if we can't price it
            }

            if (underlyingPrice === 0) continue;

            // Calculate Settlement Price (Intrinsic Value)
            let sttPrice = 0;
            if (pos.option_type === 'CE') {
                sttPrice = Math.max(0, underlyingPrice - pos.strike_price);
            } else if (pos.option_type === 'PE') {
                sttPrice = Math.max(0, pos.strike_price - underlyingPrice);
            }

            // Realized PnL: (Exit - Entry) * Qty
            const lotSize = pos.lot_size || getLotSize(underlying);
            const totalUnits = Math.abs(pos.qty); // Absolute units

            // if Qty > 0 (Long), Paid entry, receive sttPrice
            // if Qty < 0 (Short), Received entry, pay sttPrice
            const realizedPnL = pos.qty > 0
                ? (sttPrice - pos.avg_price) * totalUnits
                : (pos.avg_price - sttPrice) * totalUnits;

            // Margin Release Calculation
            // For buys, margin released is 0 (premium was already paid). 
            // For sells, full blocked margin is released.
            let marginReleased = 0;
            if (pos.qty < 0) {
                // Approximation of original blocked margin
                marginReleased = (pos.avg_price * totalUnits) * 2.5;
            }

            // The net cash added to balance upon settlement:
            // If LONG: You receive the Intrinsic Value. Add (sttPrice * units) to balance.
            // If SHORT: You return the margin + entry premium, but lose Intrinsic Value. 
            // Actually, balance impact = Margin Released + Realized PnL

            let balanceImpact = 0;
            if (pos.qty > 0) {
                balanceImpact = sttPrice * totalUnits;
            } else {
                balanceImpact = marginReleased + realizedPnL;
            }

            totalBalanceImpact += balanceImpact;
            totalPnLImpact += realizedPnL;

            // Delete the expired position
            await supabase.from('fo_positions').delete().eq('id', pos.id);

            // Log the settlement trade for history
            await supabase.from('trades').insert({
                user_id: session.user.id,
                symbol: pos.contract_symbol,
                type: pos.qty > 0 ? 'SELL' : 'BUY',
                qty: totalUnits,
                price: sttPrice,
                instrument_type: 'SETTLEMENT',
                notes: `Auto-settled at expiry. Underlying: ₹${underlyingPrice.toFixed(2)}`
            });

            settledCount++;
        }

        // Apply Portfolio updates
        if (settledCount > 0) {
            await supabase.from('portfolios').update({
                balance: portfolio.balance + totalBalanceImpact,
                total_pnl: (portfolio.total_pnl || 0) + totalPnLImpact
            }).eq('id', portfolio.id);
        }

        return NextResponse.json({ success: true, settledCount, totalPnLImpact });

    } catch (error: any) {
        console.error('Settlement Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
