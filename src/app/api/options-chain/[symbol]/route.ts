import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 30; // Cache response for 30 seconds

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const resolvedParams = await params;
        const symbol = resolvedParams.symbol.toUpperCase();
        const validSymbols = ['NIFTY', 'BANKNIFTY'];

        if (!validSymbols.includes(symbol)) {
            return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
        }

        const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/option-chain',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`NSE blocked request with status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.records || !data.records.data) {
            throw new Error('Invalid data format from NSE');
        }

        const mappedData = data.records.data.map((item: any) => ({
            strike: item.strikePrice,
            CE: item.CE ? {
                ltp: item.CE.lastPrice || 0,
                oi: item.CE.openInterest || 0,
                vol: item.CE.totalTradedVolume || 0,
                iv: item.CE.impliedVolatility || 0,
                delta: 0, // Not provided by NSE directly
                theta: 0  // Not provided by NSE directly
            } : { ltp: 0, oi: 0, vol: 0, iv: 0 },
            PE: item.PE ? {
                ltp: item.PE.lastPrice || 0,
                oi: item.PE.openInterest || 0,
                vol: item.PE.totalTradedVolume || 0,
                iv: item.PE.impliedVolatility || 0,
                delta: 0,
                theta: 0
            } : { ltp: 0, oi: 0, vol: 0, iv: 0 },
            expiry: item.expiryDate
        }));

        // Group by expiry
        const groupedByExpiry = mappedData.reduce((acc: any, curr: any) => {
            if (!acc[curr.expiry]) {
                acc[curr.expiry] = {
                    expiry: curr.expiry,
                    options: []
                };
            }
            // Remove expiry field from individual option object
            const { expiry, ...optionData } = curr;
            acc[curr.expiry].options.push(optionData);
            return acc;
        }, {});

        const chain = Object.values(groupedByExpiry);

        // Sort strikes for each expiry
        chain.forEach((c: any) => {
            c.options.sort((a: any, b: any) => a.strike - b.strike);
        });

        return NextResponse.json({
            chain: chain,
            ltp: data.records.underlyingValue || 0
        });

    } catch (error) {
        console.error('NSE Option Chain API Error:', error);
        return NextResponse.json(
            { error: 'Option data temporarily unavailable.', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 503 }
        );
    }
}
