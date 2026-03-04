import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache response for 30 seconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'NIFTY').toUpperCase();
    const reqExpiry = searchParams.get('expiry');

    const validSymbols = ['NIFTY', 'BANKNIFTY'];
    if (!validSymbols.includes(symbol)) {
        return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
    }

    try {
        const growwSymbol = symbol.toLowerCase();
        const baseUrl = `https://groww.in/v1/api/option_chain_service/v1/option_chain/derivatives/${growwSymbol}`;
        const url = reqExpiry ? `${baseUrl}?expiry=${reqExpiry}` : baseUrl;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Options API blocked request with status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.optionChain || !data.optionChain.optionChains) {
            throw new Error('Invalid data format from provider');
        }

        const availableExpiries = data.optionChain.expiryDetailsDto?.expiryDates || [];

        const mappedOptions = data.optionChain.optionChains.map((item: any) => ({
            strike: item.strikePrice / 100,
            CE: item.callOption ? {
                ltp: item.callOption.ltp || 0,
                oi: item.callOption.openInterest * 10 || 0, // Multiply by 10
                vol: item.callOption.volume || 0,
                iv: 0,
                delta: 0,
                theta: 0
            } : { ltp: 0, oi: 0, vol: 0, iv: 0 },
            PE: item.putOption ? {
                ltp: item.putOption.ltp || 0,
                oi: item.putOption.openInterest * 10 || 0,
                vol: item.putOption.volume || 0,
                iv: 0,
                delta: 0,
                theta: 0
            } : { ltp: 0, oi: 0, vol: 0, iv: 0 }
        }));

        let activeExpiry = reqExpiry;
        if (!activeExpiry && availableExpiries.length > 0) {
            activeExpiry = availableExpiries[0];
        }

        let chain = [];
        if (availableExpiries.length > 0) {
            chain = availableExpiries.map((exp: string) => ({
                expiry: exp,
                options: exp === activeExpiry ? mappedOptions : []
            }));
        } else {
            chain = [{ expiry: activeExpiry || 'Unknown', options: mappedOptions }];
        }

        return NextResponse.json({
            underlying: symbol,
            chain,
            ltp: data.livePrice?.value || 0
        });

    } catch (error: any) {
        console.error('Option Chain API Error:', error);
        return NextResponse.json(
            { error: 'Option data temporarily unavailable.', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 503 }
        );
    }
}
