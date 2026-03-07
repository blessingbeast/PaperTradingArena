'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ZapOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

export default function AdminPositionsPage() {
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchPositions = async () => {
        try {
            const res = await fetch('/api/admin/positions');
            if (res.ok) {
                const data = await res.json();
                setPositions(data.positions || []);
            }
        } catch (e) {
            toast.error('Failed to load global active positions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    // Admins forcing a close essentially injects a direct Market Market order inverting the user's quantities
    const forceClosePosition = async (userId: string, targetEmail: string, symbol: string, netQty: number) => {
        if (!confirm(`Are you sure you want to FORCE CLOSE the position for ${targetEmail} on ${symbol}?`)) return;
        
        const actionKey = `${userId}_${symbol}`;
        setActionId(actionKey);
        
        try {
            // Simulated Force Close using an internal Admin override hook.
            // Normally this hits the `trade` engine, but here we can bypass limits for safety executions.
            const res = await fetch(`/api/orders/place`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    type: netQty > 0 ? 'SELL' : 'BUY', // Invert direction to close out
                    qty: Math.abs(netQty),
                    order_type: 'MARKET',
                    asset_class: symbol.match(/[0-9]{2}[A-Z]{3}[0-9]/) ? 'FO' : 'EQ',
                    // The backend Trade Engine extracts `user_id` from session.
                    // This is a direct Admin bypass impersonation for demonstration purposes.
                    // A true secure implementation would require an `admin/positions/force-close` specific API hook.
                    override_user_id: userId 
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Position Force Closed');
                fetchPositions();
            } else {
                toast.error(data.error || 'Failed to force close position cross-user limits.');
            }
        } catch (e) {
            toast.error('Execution failure');
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Active Positions</h1>
                    <p className="text-muted-foreground mt-2">Globally monitor all currently held native capital allocations.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Input placeholder="Search symbols or emails..." className="max-w-xs bg-card/50" />
                </div>
            </div>

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-cyan-500/50">
                <div className="overflow-x-auto">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Instrument</th>
                                    <th className="py-3 px-4">Net Qty</th>
                                    <th className="py-3 px-4">Avg Price</th>
                                    <th className="py-3 px-4">LTP</th>
                                    <th className="py-3 px-4">Entry Time</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {positions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-muted-foreground">No active positions across platform</td>
                                    </tr>
                                ) : positions.map((pos, idx) => {
                                    const actionKey = `${pos.user_id}_${pos.symbol}`;
                                    return (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-foreground">{pos.email}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{pos.user_id.split('-')[0]}...</div>
                                            </td>
                                            <td className="py-3 px-4 font-bold">{pos.symbol}</td>
                                            <td className="py-3 px-4">
                                                <span className={cn(
                                                    "font-mono font-medium",
                                                    pos.net_qty > 0 ? "text-blue-500" : "text-orange-500"
                                                )}>
                                                    {pos.net_qty > 0 ? `+${pos.net_qty}` : pos.net_qty}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono">{formatCurrency(pos.avg_price)}</td>
                                            <td className="py-3 px-4 font-mono text-muted-foreground">--</td>
                                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                                                {new Date(pos.entry_time).toLocaleString('en-IN', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <Button 
                                                    size="sm" variant="outline" 
                                                    className="h-8 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
                                                    onClick={() => forceClosePosition(pos.user_id, pos.email, pos.symbol, pos.net_qty)}
                                                    disabled={actionId === actionKey}
                                                >
                                                    {actionId === actionKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <ZapOff className="h-3 w-3 mr-1" />}
                                                    Force Close
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
