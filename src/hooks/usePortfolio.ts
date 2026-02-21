
import { useState, useEffect } from 'react';
import { Position } from '@/types';

export interface DashboardPosition extends Position {
    ltp?: number;
    current?: number;
    invested?: number;
    pnl?: number;
    percent?: number;
}

interface PortfolioData {
    balance: number;
    invested: number;
    currentValue: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    dayPnL: number;
    dayPnLPercent: number;
    holdings: DashboardPosition[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function usePortfolio(): PortfolioData {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/portfolio');
                if (!res.ok) {
                    if (res.status === 401) {
                        setLoading(false);
                        return; // Not logged in
                    }
                    throw new Error('Failed to fetch portfolio');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [trigger]);

    const refresh = () => setTrigger(prev => prev + 1);

    // Calculate generic day PnL (using unrealized as proxy for now as per API)
    const dayPnL = data?.unrealizedPnL || 0;
    const dayPnLPercent = data?.invested > 0 ? (dayPnL / data.invested) * 100 : 0;

    return {
        balance: data?.balance || 0,
        invested: data?.invested || 0,
        currentValue: data?.currentValue || 0,
        totalPnL: data?.totalPnL || 0,
        realizedPnL: data?.realizedPnL || 0,
        unrealizedPnL: data?.unrealizedPnL || 0,
        dayPnL,
        dayPnLPercent,
        holdings: data?.holdings || [],
        loading,
        error,
        refresh
    };
}
