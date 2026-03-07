
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!symbols || (Array.isArray(symbols) && symbols.length === 0)) {
            setLoading(false);
            return;
        }

        // Clear old data when symbol changes so UI doesn't show previous stock's price
        setData([]);
        setLoading(true);

        const fetchPendingOrders = async () => {
            try {
                const res = await fetch('/api/orders/history');
                const orders = await res.json();
                if (Array.isArray(orders)) {
                    setPendingOrders(orders.filter(o => o.status === 'PENDING' && (o.order_type === 'SL-M' || o.order_type === 'LIMIT')));
                }
            } catch (e) { }
        };

        const fetchMarketData = async () => {
            try {
                const symbolList = Array.isArray(symbols) ? symbols.join(',') : symbols;
                const res = await fetch(`/api/market-data?symbols=${symbolList}`);
                const result = await res.json();

                if (result.error) throw new Error(result.error);
                setData(result);

                // Active Execution Engine Check
                // We do this loop to simulate continuous market scanning for SL/Targets
                if (Array.isArray(result) && pendingOrders.length > 0) {
                    for (const tick of result) {
                        const triggers = pendingOrders.filter(o => o.symbol === tick.symbol);
                        for (const order of triggers) {
                            let shouldExecute = false;

                            if (order.order_type === 'SL-M') {
                                // For Stop Loss, Buy SL triggers if LTP >= trigger, Sell SL triggers if LTP <= trigger
                                if (order.trade_type === 'BUY' && tick.price >= order.trigger_price) shouldExecute = true;
                                if (order.trade_type === 'SELL' && tick.price <= order.trigger_price) shouldExecute = true;
                            } else if (order.order_type === 'LIMIT') {
                                // For Target (Limit), Sell Target triggers if LTP >= requested, Buy Target triggers if LTP <= requested
                                if (order.trade_type === 'SELL' && tick.price >= order.requested_price) shouldExecute = true;
                                if (order.trade_type === 'BUY' && tick.price <= order.requested_price) shouldExecute = true;
                            }

                            if (shouldExecute) {
                                // Fire and forget async execution trigger
                                fetch('/api/trade/execute-pending', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ order_id: order.id, executed_price: tick.price })
                                }).then(r => r.json()).then(data => {
                                    if (data.success) {
                                        // Trigger a refetch of pending orders to remove it from state
                                        fetchPendingOrders();
                                        toast.success(`Order Executed: Exit for ${order.symbol} triggered at ₹${tick.price}`);
                                    }
                                }).catch(e => console.error("Auto-execution failed:", e));
                            }
                        }
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingOrders(); // Initial fetch
        fetchMarketData();

        // 10s poll for orders to keep it fresh
        const ordersInterval = setInterval(fetchPendingOrders, 10000);
        const interval = setInterval(fetchMarketData, pollIntervalMs);

        return () => {
            clearInterval(ordersInterval);
            clearInterval(interval);
        };
    }, [JSON.stringify(symbols), pendingOrders.length]);

    return { data, loading, error };
}
