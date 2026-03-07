'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (e) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const cancelGlobalOrder = async (id: string) => {
        setActionId(id);
        try {
            const res = await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Order Force Cancelled');
                fetchOrders();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('Failed to cancel order');
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Global Orders</h1>
                <p className="text-muted-foreground mt-2">Monitor all platform trading logs across user authentication sets.</p>
            </div>

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/50">
                <div className="overflow-x-auto">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Instrument</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Qty</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground">No platform orders found</td>
                                    </tr>
                                ) : orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-foreground">{order.users?.email || 'Unknown'}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{order.user_id.split('-')[0]}...</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold">{order.symbol}</div>
                                            <div className="text-[10px] text-muted-foreground bg-secondary inline-block px-1 rounded uppercase tracking-widest">{order.instrument_type}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn(
                                                "font-bold rounded-sm px-1.5 py-0.5 text-[10px] uppercase text-white shadow-sm",
                                                order.trade_type === 'BUY' ? "bg-blue-600" : "bg-red-600"
                                            )}>
                                                {order.trade_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono">{order.filled_qty} / {order.qty}</td>
                                        <td className="py-3 px-4 font-mono">{formatCurrency(order.requested_price)}</td>
                                        <td className="py-3 px-4">
                                             <span className={cn(
                                                "text-[10px] px-2 py-1 rounded font-medium",
                                                order.status === 'EXECUTED' ? "bg-green-500/20 text-green-500" : 
                                                order.status === 'PENDING' ? "bg-yellow-500/20 text-yellow-500" : 
                                                "bg-red-500/20 text-red-500"
                                            )}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                                            {new Date(order.created_at).toLocaleString('en-IN', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            {order.status === 'PENDING' && (
                                                <Button 
                                                    size="sm" variant="outline" 
                                                    className="h-8 border-red-500/50 text-red-500 hover:bg-red-500/10"
                                                    onClick={() => cancelGlobalOrder(order.id)}
                                                    disabled={actionId === order.id}
                                                >
                                                    {actionId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                                    Force Cancel
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
