import { NextResponse } from 'next/server';
import { mapToYahooTicker, getNextExpiries } from '@/lib/fo-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'NIFTY';
    const reqExpiry = searchParams.get('expiry');

    try {
        // 1. Resolve Underlying Price
        const upperSymbol = symbol.toUpperCase();
        let yfUnderlying = symbol;
        if (upperSymbol === 'NIFTY') yfUnderlying = '^NSEI';
        else if (upperSymbol === 'BANKNIFTY') yfUnderlying = '^NSEBANK';
        else if (!yfUnderlying.includes('.')) yfUnderlying += '.NS';

        const uRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfUnderlying}?interval=1d&range=1d`, { next: { revalidate: 60 } });
        const uData = await uRes.json();
        const S = uData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;

        if (S === 0) {
            throw new Error(`Could not fetch underlying price for ${symbol}`);
        }

        // 2. Setup Strikes & Real Expiries
        let step = S > 10000 ? 50 : 20;
        if (upperSymbol === 'BANKNIFTY') step = 100;
        const atm = Math.round(S / step) * step;
        const strikes = Array.from({ length: 21 }, (_, i) => atm + (i - 10) * step);

        const expiries = getNextExpiries(symbol);
        const targetExpiry = reqExpiry || expiries[0];

        // 3. Batch Fetch Option Prices
        const optionsData = await Promise.all(strikes.map(async (K) => {
            const ceTicker = mapToYahooTicker(symbol, targetExpiry, K, 'CE');
            const peTicker = mapToYahooTicker(symbol, targetExpiry, K, 'PE');

            const [ceRes, peRes] = await Promise.all([
                fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ceTicker}?interval=1d&range=1d`, { next: { revalidate: 60 } }).then(r => r.json()).catch(() => null),
                fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${peTicker}?interval=1d&range=1d`, { next: { revalidate: 60 } }).then(r => r.json()).catch(() => null)
            ]);

            const ceLtp = ceRes?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
            const peLtp = peRes?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;

            return {
                strike: K,
                CE: {
                    ltp: ceLtp,
                    bid: (ceLtp || 0) * 0.998, // Professional estimate if bid/ask missing
                    ask: (ceLtp || 0) * 1.002,
                    oi: ceRes?.chart?.result?.[0]?.meta?.openInterest || 0,
                    vol: ceRes?.chart?.result?.[0]?.meta?.regularMarketVolume || 0,
                    is_real: ceLtp > 0
                },
                PE: {
                    ltp: peLtp,
                    bid: (peLtp || 0) * 0.998,
                    ask: (peLtp || 0) * 1.002,
                    oi: peRes?.chart?.result?.[0]?.meta?.openInterest || 0,
                    vol: peRes?.chart?.result?.[0]?.meta?.regularMarketVolume || 0,
                    is_real: peLtp > 0
                }
            };
        }));

        return NextResponse.json({
            underlying: symbol,
            ltp: S,
            chain: [
                {
                    expiry: targetExpiry,
                    options: optionsData
                },
                ...expiries.filter(e => e !== targetExpiry).map(e => ({ expiry: e, options: [] }))
            ]
        });

    } catch (e: any) {
        console.error('Option Chain API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
