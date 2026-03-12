'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, Activity, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PositionsPage() {
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPositions = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch('/api/positions', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load positions');
            const data = await res.json();
            setPositions(data.positions || []);
        } catch (e: any) {
            console.error('Positions fetch error:', e);
            toast.error('Failed to sync positions. Retrying...');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPositions();
        // Auto-refresh every 10 seconds for live PnL
        const interval = setInterval(() => fetchPositions(true), 10000);
        return () => clearInterval(interval);
    }, []);

    const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
    const totalInvested = positions.reduce((sum, p) => sum + (p.invested || 0), 0);

    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium tracking-tight">Syncing Active Positions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 rounded-full border border-sky-500/20">
                            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Live Sync</span>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium">{positions.length} open position{positions.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchPositions(true)} disabled={refreshing} className="gap-2">
                    <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {/* Summary Row */}
            {positions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Open Positions</p>
                            <p className="text-2xl font-bold">{positions.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Invested</p>
                            <p className="text-2xl font-bold font-mono">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </CardContent>
                    </Card>
                    <Card className={cn('shadow-sm col-span-2', totalPnL >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30')}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Unrealized P&L</p>
                            <p className={cn('text-2xl font-bold font-mono', totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Positions Table */}
            <Card className="shadow-2xl overflow-hidden border-t-0 rounded-xl">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/20 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <Briefcase className="h-5 w-5 text-slate-400" /> Open Position List
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-border text-slate-500">
                                <tr className="text-left uppercase text-[10px] font-black tracking-widest">
                                    <th className="py-4 px-6">Instrument</th>
                                    <th className="py-4 px-6">Type</th>
                                    <th className="py-4 px-6 text-right">Qty (Lots)</th>
                                    <th className="py-4 px-6 text-right">Avg Price</th>
                                    <th className="py-4 px-6 text-right">LTP</th>
                                    <th className="py-4 px-6 text-right">Unrealized P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {positions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <Briefcase className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No Open Trades</h3>
                                                <p className="text-slate-400 text-sm mb-6 leading-relaxed px-4">
                                                    Your equity and F&O positions will appear here with live P&L once you place a trade.
                                                </p>
                                                <Link href="/dashboard/trade">
                                                    <Button className="h-11 px-10 font-black shadow-lg shadow-primary/20 rounded-full uppercase text-xs tracking-wider">Start Trading</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    positions.map((pos) => {
                                        const isProfit = (pos.unrealized_pnl || 0) >= 0;
                                        const lotsDisplay = pos.lot_size > 1
                                            ? `${pos.lots?.toFixed(0) || Math.abs(pos.qty) / pos.lot_size} lots`
                                            : `${Math.abs(pos.qty)} qty`;

                                        return (
                                            <tr key={pos.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-slate-900 dark:text-slate-100 text-[13px] tracking-tight">{pos.symbol}</span>
                                                        {pos.is_fo && pos.strike_price && (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                {pos.underlying_symbol} {pos.strike_price} {pos.option_type} · {pos.expiry_date}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge className={cn(
                                                            'font-black text-[10px] px-2 py-0.5 rounded-sm w-fit',
                                                            pos.is_fo ? 'bg-purple-600 text-white' : 'bg-slate-950 text-white'
                                                        )}>
                                                            {pos.instrument_type || (pos.is_fo ? 'F&O' : 'EQ')}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                            {pos.qty > 0 ? 'LONG' : 'SHORT'}
                                                            <Activity className="h-3 w-3 text-slate-300" />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono font-bold">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn('text-[13px]', pos.qty < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                                            {pos.qty < 0 ? '-' : '+'}{Math.abs(pos.qty)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{lotsDisplay}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono text-[13px] text-slate-500">
                                                    ₹{(pos.avg_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-black text-[13px] text-slate-900 dark:text-white">
                                                                ₹{(pos.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <div className={cn('w-1.5 h-1.5 rounded-full', pos.ltp > pos.avg_price ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500')} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={cn('font-black font-mono text-[14px]', isProfit ? 'text-emerald-500' : 'text-rose-500')}>
                                                            {isProfit ? '+' : ''}₹{(pos.unrealized_pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className={cn('text-[10px] font-semibold flex items-center gap-0.5', isProfit ? 'text-emerald-500/60' : 'text-rose-500/60')}>
                                                            {isProfit ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                            {pos.invested > 0 ? ((Math.abs(pos.unrealized_pnl) / pos.invested) * 100).toFixed(2) : '0.00'}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
