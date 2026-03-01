
import { useState, useEffect } from 'react';
import { Position } from '@/types';

export interface DashboardPosition extends Position {
    ltp: number;
    current: number;
    invested: number;
    pnl: number;
    percent: number;
    ticker?: string;
    is_fo?: boolean;
    is_live?: boolean;
}

interface PortfolioData {
    balance: number;
    invested: number;
    currentValue: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    marginLocked: number;
    dayPnL: number;
    dayPnLPercent: number;
    holdings: DashboardPosition[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    _debug?: any;
}

export function usePortfolio(): PortfolioData {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    const fetchPortfolio = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('/api/portfolio', { cache: 'no-store' });
            if (!res.ok) {
                if (res.status === 401) return;
                throw new Error('Failed to fetch portfolio data');
            }
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err: any) {
            console.error('usePortfolio Error:', err);
            setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-settle expired F&O contracts silently in the background
        fetch('/api/trade/settle', { method: 'POST' }).catch(() => { });

        fetchPortfolio();

        // Professional Live Refresh: 5 seconds
        const interval = setInterval(() => {
            fetchPortfolio(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [trigger]);

    const refresh = () => setTrigger(prev => prev + 1);

    return {
        balance: data?.balance || 0,
        invested: data?.invested || 0,
        currentValue: data?.currentValue || 0,
        totalPnL: data?.totalPnL || 0,
        realizedPnL: data?.realizedPnL || 0,
        unrealizedPnL: data?.unrealizedPnL || 0,
        marginLocked: data?.marginLocked || 0,
        dayPnL: data?.unrealizedPnL || 0,
        dayPnLPercent: data?.invested > 0 ? (data.unrealizedPnL / data.invested) * 100 : 0,
        holdings: data?.holdings || [],
        loading,
        error,
        refresh,
        _debug: data?._debug
    };
}
