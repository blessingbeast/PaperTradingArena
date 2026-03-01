import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsQuery = searchParams.get('symbols');

    if (!symbolsQuery) {
        return NextResponse.json({ error: 'Symbols required' }, { status: 400 });
    }

    const symbols = symbolsQuery.split(',').map(s => s.trim());

    try {
        const quotes = await Promise.all(
            symbols.map(rawSymbol => {
                // Formatting symbol for Yahoo Finance
                const upperSymbol = rawSymbol.toUpperCase().trim();
                let symbol = rawSymbol;

                // Explicit Index mapping for NIFTY / BANKNIFTY
                if (upperSymbol === 'NIFTY' || upperSymbol === 'NIFTY 50' || upperSymbol === 'NSE:NIFTY') {
                    symbol = '^NSEI';
                } else if (upperSymbol === 'BANKNIFTY' || upperSymbol === 'BANK NIFTY' || upperSymbol === 'NSE:BANKNIFTY') {
                    symbol = '^NSEBANK';
                } else if (upperSymbol === 'SENSEX') {
                    symbol = '^BSESN';
                } else if (upperSymbol === 'FINNIFTY') {
                    symbol = '^CNXFIN';
                } else if (symbol.startsWith('^')) {
                    // Indices like ^NSEI, ^BSESN do not need exchange suffixes
                } else if (!symbol.includes('.') && !symbol.includes(':')) {
                    symbol = `${symbol}.NS`;
                } else if (symbol.includes(':')) {
                    const parts = symbol.split(':');
                    if (parts.length === 2) {
                        symbol = `${parts[1]}.${parts[0] === 'BSE' ? 'BO' : 'NS'}`;
                    }
                }

                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
                return fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.chart.error) {
                            throw new Error(data.chart.error.description || 'API Error');
                        }
                        const result = data.chart.result?.[0];
                        if (!result) throw new Error('No data');

                        const meta = result.meta;
                        // Calculate change since previous close
                        const price = meta.regularMarketPrice;
                        const prevClose = meta.chartPreviousClose;
                        const change = price - prevClose;
                        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

                        // Extract historical closes for sparkline (last 20 days)
                        let sparkline = [];
                        if (result.indicators?.quote?.[0]?.close) {
                            sparkline = result.indicators.quote[0].close.filter((c: any) => c !== null);
                            if (sparkline.length > 20) {
                                sparkline = sparkline.slice(-20);
                            }
                        }

                        return {
                            symbol: rawSymbol, // Important: use raw symbol so UI components match it
                            price: price,
                            change: change,
                            changePercent: changePercent,
                            name: meta.shortName || meta.longName || rawSymbol,
                            low: meta.regularMarketDayLow,
                            high: meta.regularMarketDayHigh,
                            volume: meta.regularMarketVolume,
                            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
                            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
                            sparkline
                        };
                    })
                    .catch(err => {
                        console.error(`Quote error for ${symbol}:`, err.message);
                        // Fallback deterministic base price from symbol
                        let hash = 0;
                        for (let i = 0; i < rawSymbol.length; i++) hash += rawSymbol.charCodeAt(i);
                        let basePrice = 100 + (hash % 900);

                        return {
                            symbol: rawSymbol,
                            price: basePrice,
                            change: 0,
                            changePercent: 0,
                            name: `${rawSymbol} (Mock)`,
                            low: basePrice * 0.99,
                            high: basePrice * 1.01,
                            volume: 1000
                        };
                    });
            })
        );

        return NextResponse.json(quotes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
