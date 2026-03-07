/**
 * Centralized Market Data Service 
 * Fetches and processes pricing from live sources like Yahoo Finance & NSE
 */

// Fallback pricing map for graceful degradation
const sessionFallbacks: Record<string, number> = {};

export function setFallbackLTP(symbol: string, price: number) {
    sessionFallbacks[symbol] = price;
}

export function getFallbackLTP(symbol: string): number {
    return sessionFallbacks[symbol] || 0;
}

export async function fetchLiveQuote(symbol: string, isFo: boolean = false, underlying: string = ''): Promise<number> {
    try {
        if (!isFo) {
            let ticker = symbol.includes('.') ? symbol : `${symbol}.NS`;
            if (symbol === 'NIFTY') ticker = '^NSEI';
            else if (symbol === 'BANKNIFTY') ticker = '^NSEBANK';
            else if (symbol === 'FINNIFTY') ticker = '^CNXFIN';
            
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { next: { revalidate: 60 } });
            const data = await res.json();
            return data?.chart?.result?.[0]?.meta?.regularMarketPrice || getFallbackLTP(symbol);
        } else {
            // For F&O, logic should ideally poll NSE or rely on the cached Groww response.
            // Placeholder for F&O live quotes -> Falls back to average invested price heavily in the portfolio.
            return getFallbackLTP(symbol);
        }
    } catch (e) {
        console.error(`Quote fetch failed for ${symbol}`, e);
        return getFallbackLTP(symbol);
    }
}
