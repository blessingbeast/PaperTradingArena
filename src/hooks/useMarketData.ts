
import { useState, useEffect } from 'react';

export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    name: string;
    high?: number;
    low?: number;
    volume?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    sparkline?: number[];
}

export function useMarketData(symbols: string | string[], pollIntervalMs = 5000) {
    const [data, setData] = useState<MarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbols || (Array.isArray(symbols) && symbols.length === 0)) {
            setLoading(false);
            return;
        }

        // Clear old data when symbol changes so UI doesn't show previous stock's price
        setData([]);
        setLoading(true);

        const fetchMarketData = async () => {
            try {
                const symbolList = Array.isArray(symbols) ? symbols.join(',') : symbols;
                const res = await fetch(`/api/market-data?symbols=${symbolList}`);
                const result = await res.json();

                if (result.error) throw new Error(result.error);
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, pollIntervalMs);

        return () => clearInterval(interval);
    }, [JSON.stringify(symbols)]);

    return { data, loading, error };
}
