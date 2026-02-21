
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { symbol, type, qty, price, instrument_type, order_type = 'MARKET', requested_price, trigger_price } = await request.json();

        if (!symbol || !type || !qty || qty <= 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 0. Market Hours Check (9:15 AM to 3:30 PM IST, Monday - Friday)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const day = istTime.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
        const hour = istTime.getUTCHours();
        const minute = istTime.getUTCMinutes();
        const timeInMinutes = hour * 60 + minute;

        const isWeekday = day >= 1 && day <= 5;
        const isWithinHours = timeInMinutes >= (9 * 60 + 15) && timeInMinutes <= (15 * 60 + 30);

        if (!isWeekday || !isWithinHours) {
            return NextResponse.json({ error: 'Market is closed. Orders can only be placed between 9:15 AM and 3:30 PM IST on weekdays.' }, { status: 400 });
        }

        // 1. Fetch current price securely
        const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
        const yfRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=1d`);
        const yfData = await yfRes.json();
        const currentPrice = yfData?.chart?.result?.[0]?.meta?.regularMarketPrice || price; // fallback to passed price

        if (!currentPrice) {
            return NextResponse.json({ error: 'Failed to fetch market price' }, { status: 500 });
        }

        // 2. Get User Portfolio
        const { data: portfolio, error: portError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (portError || !portfolio) throw new Error('Portfolio not found');

        // Check required margin
        const leverage = instrument_type === 'MIS' ? 5 : 1;
        const refPrice = order_type === 'MARKET' ? currentPrice : (requested_price || trigger_price || currentPrice);
        const tradeValue = refPrice * qty;
        const requiredMargin = tradeValue / leverage;

        // Calculate Charges (Zerodha equivalent)
        let brokerage = 0;
        let stt = 0;
        const exchangeReqCharges = tradeValue * 0.0000345;
        if (instrument_type === 'MIS') {
            brokerage = Math.min(tradeValue * 0.0003, 20);
            stt = type === 'SELL' ? tradeValue * 0.00025 : 0;
        } else {
            brokerage = 0;
            stt = tradeValue * 0.001;
        }
        const gst = (brokerage + exchangeReqCharges) * 0.18;
        const totalCharges = brokerage + stt + exchangeReqCharges + gst;

        const totalCost = requiredMargin + (type === 'BUY' ? totalCharges : totalCharges); // Simplification: we deduct charges in both cases from available balance immediately or settled from revenue

        if (type === 'BUY' && portfolio.balance < totalCost) {
            return NextResponse.json({ error: 'Insufficient Margin' }, { status: 400 });
        }

        const chargesBreakdown = {
            brokerage,
            stt,
            exchange_charges: exchangeReqCharges,
            gst,
            total: totalCharges
        };

        if (order_type !== 'MARKET') {
            // Store as pending order
            const { error: orderError } = await supabase.from('orders').insert({
                user_id: session.user.id,
                symbol,
                trade_type: type,
                order_type,
                qty,
                filled_qty: 0,
                requested_price,
                trigger_price,
                instrument_type,
                status: 'PENDING',
                charges_breakdown: chargesBreakdown
            });

            if (orderError) throw orderError;
            return NextResponse.json({ success: true, status: 'PENDING' });
        }

        // === MARKET ORDER EXECUTION ===
        // Insert as pending conceptually
        const { data: orderData, error: insertError } = await supabase.from('orders').insert({
            user_id: session.user.id,
            symbol,
            trade_type: type,
            order_type,
            qty,
            filled_qty: 0,
            instrument_type,
            status: 'PENDING',
            charges_breakdown: chargesBreakdown
        }).select().single();

        if (insertError) throw insertError;

        // Simulate Network / Execution Latency (0.6s to 1.6s)
        await new Promise(r => setTimeout(r, 600 + Math.random() * 1000));

        // Simulate Slippage (up to 0.02% against the user favor due to volatility)
        const slipPercent = Math.random() * 0.0002;
        const executedPrice = type === 'BUY' ? currentPrice * (1 + slipPercent) : currentPrice * (1 - slipPercent);

        // Calculate actual cost for exact execution
        const finalTradeValue = executedPrice * qty;
        const finalRequiredMargin = finalTradeValue / leverage;

        // Execution logic
        if (type === 'BUY') {
            const deduct = finalRequiredMargin + totalCharges;
            if (portfolio.balance < deduct) {
                await supabase.from('orders').update({ status: 'REJECTED', rejection_reason: 'Margin shortfall after slippage' }).eq('id', orderData.id);
                return NextResponse.json({ error: 'Margin shortfall after slippage' }, { status: 400 });
            }

            const newBalance = portfolio.balance - deduct;
            const { error: portUpdateError } = await supabase.from('portfolios').update({ balance: newBalance }).eq('user_id', session.user.id);
            if (portUpdateError) throw new Error('Failed to update portfolio balance. (Missing RLS?). -> ' + portUpdateError.message);

            const { data: existingPosition } = await supabase
                .from('positions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('symbol', symbol)
                .single();

            if (existingPosition) {
                const newQty = existingPosition.qty + qty;
                const totalAssetValue = (existingPosition.avg_price * existingPosition.qty) + (executedPrice * qty);
                const newAvg = totalAssetValue / newQty;

                const { error: posUpdateError } = await supabase.from('positions').update({ qty: newQty, avg_price: newAvg, updated_at: new Date() }).eq('id', existingPosition.id);
                if (posUpdateError) throw new Error('Failed to update existing position -> ' + posUpdateError.message);
            } else {
                const { error: posInsError } = await supabase.from('positions').insert({
                    user_id: session.user.id,
                    symbol,
                    qty,
                    avg_price: executedPrice,
                    instrument_type: instrument_type || 'CNC',
                });
                if (posInsError) throw new Error('Failed to insert new position -> ' + posInsError.message);
            }

        } else if (type === 'SELL') {
            const { data: existingPosition } = await supabase
                .from('positions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('symbol', symbol)
                .single();

            if (!existingPosition || existingPosition.qty < qty) {
                await supabase.from('orders').update({ status: 'REJECTED', rejection_reason: 'Insufficient shares' }).eq('id', orderData.id);
                return NextResponse.json({ error: 'Insufficient Share Quantity' }, { status: 400 });
            }

            // We use the original entry margin constraint to calculate margin return
            const entryLeverage = existingPosition.instrument_type === 'MIS' ? 5 : 1;
            const marginReleased = (existingPosition.avg_price * qty) / entryLeverage;
            const realizedPnL = (executedPrice - existingPosition.avg_price) * qty;

            const revenue = marginReleased + realizedPnL - totalCharges;
            const newBalance = portfolio.balance + revenue;
            const newTotalPnL = (portfolio.total_pnl || 0) + realizedPnL;

            const { error: portUpdError } = await supabase.from('portfolios').update({ balance: newBalance, total_pnl: newTotalPnL }).eq('user_id', session.user.id);
            if (portUpdError) throw new Error('Failed to update portfolio bounds on SELL -> ' + portUpdError.message);

            if (existingPosition.qty === qty) {
                const { error: posDelError } = await supabase.from('positions').delete().eq('id', existingPosition.id);
                if (posDelError) throw new Error('Failed to delete flat position -> ' + posDelError.message);
            } else {
                const { error: posUpdError } = await supabase.from('positions').update({ qty: existingPosition.qty - qty, updated_at: new Date() }).eq('id', existingPosition.id);
                if (posUpdError) throw posUpdError;
            }

            // Auto-Sync to Trading Journal
            const journalEntry = {
                user_id: session.user.id,
                symbol: symbol,
                entry_date: existingPosition.created_at, // Approximate entry date
                exit_date: new Date().toISOString(),
                entry_price: existingPosition.avg_price,
                exit_price: executedPrice,
                qty: qty,
                side: 'LONG', // Currently system only supports buying then selling
                pnl: realizedPnL - totalCharges // Net PnL after charges
            };

            const { error: journalErr } = await supabase.from('journal_entries').insert(journalEntry);
            if (journalErr) {
                console.error("Failed to sync trade to journal:", journalErr);
                // We don't throw here to avoid failing the actual trade execution if just the journal fails
            }
        }

        // Update trade and order records
        const { error: tradeLogErr } = await supabase.from('trades').insert({
            user_id: session.user.id,
            symbol,
            type,
            qty,
            price: executedPrice,
            instrument_type: instrument_type || 'EQUITY',
        });
        if (tradeLogErr) throw new Error('Failed to log trade sequence. Constraint check blocked? -> ' + tradeLogErr.message);

        const { error: markExecErr } = await supabase.from('orders').update({
            status: 'EXECUTED',
            filled_qty: qty,
            executed_price: executedPrice,
            updated_at: new Date()
        }).eq('id', orderData.id);
        if (markExecErr) throw markExecErr;

        return NextResponse.json({ success: true, status: 'EXECUTED', price: executedPrice, slippage: slipPercent * 100 });

    } catch (error: any) {
        console.error('Trade API Error:', error);
        return NextResponse.json({ error: error.message || 'Trade Failed' }, { status: 500 });
    }
}
