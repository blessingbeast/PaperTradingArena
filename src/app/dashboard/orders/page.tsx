'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders/history');
            const data = await res.json();
            if (Array.isArray(data)) setOrders(data);
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const cancelOrder = async (id: string) => {
        setCancellingId(id);
        try {
            const res = await fetch(`/api/orders/cancel?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Order cancelled');
                fetchOrders();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

            <Card className="border-border/50 shadow-sm">
                <div className="overflow-x-auto">
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Instrument</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Qty</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                            No orders found
                                        </td>
                                    </tr>
                                ) : orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: '2-digit',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold">{order.symbol}</div>
                                            <div className="text-[10px] text-muted-foreground bg-secondary inline-block px-1 rounded uppercase">{order.instrument_type} | {order.order_type}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn(
                                                "font-bold rounded-sm px-1.5 py-0.5 text-xs text-white",
                                                order.trade_type === 'BUY' ? "bg-blue-600" : "bg-red-600"
                                            )}>
                                                {order.trade_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono">
                                            {order.filled_qty}/{order.qty}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-mono">{order.executed_price ? `₹${order.executed_price.toFixed(2)}` : '--'}</div>
                                            {order.order_type !== 'MARKET' && (
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                    Req: {order.requested_price ? order.requested_price.toFixed(2) : order.trigger_price?.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-semibold capitalize",
                                                order.status === 'EXECUTED' && "bg-profit/10 text-profit",
                                                order.status === 'PENDING' && "bg-orange-500/10 text-orange-500",
                                                order.status === 'REJECTED' && "bg-destructive/10 text-destructive",
                                                order.status === 'CANCELLED' && "bg-muted text-muted-foreground"
                                            )}>
                                                {order.status.toLowerCase()}
                                            </span>
                                            {order.rejection_reason && (
                                                <div className="text-[10px] text-destructive mt-1 max-w-[120px] truncate" title={order.rejection_reason}>
                                                    {order.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {order.status === 'PENDING' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => cancelOrder(order.id)}
                                                    disabled={cancellingId === order.id}
                                                >
                                                    {cancellingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
