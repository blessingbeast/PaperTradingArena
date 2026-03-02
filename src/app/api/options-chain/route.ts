import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'NIFTY';
    const reqExpiry = searchParams.get('expiry');

    // Standard Browser Headers required by NSE to bypass WAF
    const nseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    };

    try {
        // Step 1: Hit the NSE homepage to grab necessary session cookies
        const baseRes = await fetch('https://www.nseindia.com', {
            headers: nseHeaders,
            next: { revalidate: 30 } // Cache the cookie fetch briefly
        });

        const cookies = baseRes.headers.get('set-cookie');
        const fetchHeaders: HeadersInit = { ...nseHeaders, 'Accept': 'application/json' };
        if (cookies) {
            // Extract the relevant session cookies (nsesessionid, ak_bmsc, etc)
            fetchHeaders['Cookie'] = cookies.split(',').map(c => c.split(';')[0]).join('; ');
        }

        // Step 2: Hit the actual Option Chain API
        const apiUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol.toUpperCase()}`;

        const apiRes = await fetch(apiUrl, {
            headers: fetchHeaders,
            next: { revalidate: 30 } // Cache data for 30s to avoid IP bans
        });

        if (!apiRes.ok) {
            throw new Error(`NSE API returned status: ${apiRes.status}`);
        }

        const data = await apiRes.json();

        if (!data?.records?.data) {
            throw new Error('Option data temporarily unavailable.');
        }

        const rawData = data.records.data;
        const S = data.records.underlyingValue;
        const allExpiries = data.records.expiryDates;

        const targetExpiry = reqExpiry || allExpiries[0];

        // Step 3: Filter out only the requested expiry date
        const filteredRecords = rawData.filter((r: any) => r.expiryDate === targetExpiry);

        if (filteredRecords.length === 0) {
            return NextResponse.json({
                underlying: symbol, ltp: S, chain: [{ expiry: targetExpiry, options: [] }]
            });
        }

        // Step 4: Map the data to our Dashboard's expected format
        const optionsData = filteredRecords.map((r: any) => {
            const K = r.strikePrice;
            const ce = r.CE;
            const pe = r.PE;

            const ceLtp = ce?.lastPrice || 0;
            const peLtp = pe?.lastPrice || 0;

            return {
                strike: K,
                CE: {
                    ltp: ceLtp,
                    bid: ce?.bidprice || Number((ceLtp * 0.99).toFixed(2)),
                    ask: ce?.askPrice || Number((ceLtp * 1.01).toFixed(2)),
                    oi: ce?.openInterest || 0,
                    vol: ce?.totalTradedVolume || 0,
                    is_real: ceLtp > 0
                },
                PE: {
                    ltp: peLtp,
                    bid: pe?.bidprice || Number((peLtp * 0.99).toFixed(2)),
                    ask: pe?.askPrice || Number((peLtp * 1.01).toFixed(2)),
                    oi: pe?.openInterest || 0,
                    vol: pe?.totalTradedVolume || 0,
                    is_real: peLtp > 0
                }
            };
        });

        return NextResponse.json({
            underlying: symbol,
            ltp: S,
            chain: [
                {
                    expiry: targetExpiry,
                    options: optionsData
                },
                ...allExpiries.filter((e: string) => e !== targetExpiry).map((e: string) => ({ expiry: e, options: [] }))
            ]
        });

    } catch (e: any) {
        console.error('NSE Option Chain Error:', e.message);
        return NextResponse.json({ error: 'Option data temporarily unavailable.' }, { status: 503 });
    }
}
