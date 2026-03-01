'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Loader2, Activity } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function PositionsPage() {
    const { holdings, loading } = usePortfolio();

    if (loading && !holdings.length) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium tracking-tight">Syncing Active Positions...</p>
            </div>
        );
    }

    const positions = holdings;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 rounded-full border border-sky-500/20">
                            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Active Sync</span>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium">Real-time open trade management</p>
                    </div>
                </div>
            </div>

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
                                    <th className="py-4 px-6">Product</th>
                                    <th className="py-4 px-6">Instrument</th>
                                    <th className="py-4 px-6">Expiry</th>
                                    <th className="py-4 px-6 text-right">Qty (Lots)</th>
                                    <th className="py-4 px-6 text-right">Avg Price</th>
                                    <th className="py-4 px-6 text-right">LTP</th>
                                    <th className="py-4 px-6 text-right">Unrealized P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {positions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center">
                                            <div className="flex flex-col items-center max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <Briefcase className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No Open Trades</h3>
                                                <p className="text-slate-400 text-sm mb-6 leading-relaxed px-4">
                                                    Your intraday and F&O positions will appear here with live P&L tracking once you take a trade.
                                                </p>
                                                <Link href="/dashboard/trade">
                                                    <Button className="h-11 px-10 font-black shadow-lg shadow-primary/20 rounded-full uppercase text-xs tracking-wider">Start Trading</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    positions.map((stock: any) => {
                                        const isProfit = stock.pnl >= 0;
                                        const lots = stock.lot_size ? (Math.abs(stock.qty) / stock.lot_size).toFixed(1) : '1';

                                        return (
                                            <tr key={stock.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                <td className="py-5 px-6">
                                                    <Badge className="font-black text-[10px] px-2 py-0.5 bg-slate-950 text-white rounded-sm">MIS</Badge>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-slate-900 dark:text-slate-100 text-[13px] tracking-tight">{stock.symbol}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                                                            {stock.is_fo ? 'F&O Contract' : 'Equity MIS'}
                                                            <Activity className="h-3 w-3 text-slate-300" />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {stock.expiry_date ? (
                                                        <Badge variant="outline" className="text-[10px] font-black tracking-tighter text-blue-600 bg-blue-50 border-blue-200 py-0.5 px-1.5">
                                                            {new Date(stock.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-300 font-mono">—</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn("text-[13px]", stock.qty < 0 ? "text-rose-600" : "text-emerald-600")}>
                                                            {stock.qty < 0 ? '-' : '+'}{Math.abs(stock.qty)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {lots} Lots
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono text-[13px] text-slate-500">
                                                    ₹{stock.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-black text-[13px] text-slate-900 dark:text-white">
                                                                ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", stock.ltp > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn("font-black font-mono text-[14px]", isProfit ? 'text-emerald-500' : 'text-rose-500')}>
                                                            {isProfit ? '+' : ''}₹{stock.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
