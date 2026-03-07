'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, List, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Loader2, Bug, Zap, Info, Activity } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function PortfolioPage() {
    const { balance, invested, currentValue, totalPnL, unrealizedPnL, realizedPnL, marginLocked, holdings, loading, _debug } = usePortfolio() as any;
    const [showDebug, setShowDebug] = useState(false);

    if (loading && !holdings.length) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Syncing with Market Tools...</p>
            </div>
        );
    }

    const totalEquity = balance + marginLocked + unrealizedPnL;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header with Live Indicator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                            <p className="text-muted-foreground text-xs font-medium">Professional F&O Tracking</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
                    <Button
                        variant={showDebug ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowDebug(!showDebug)}
                        className="gap-2 h-9 border-dashed"
                    >
                        <Bug className="h-4 w-4" />
                        {showDebug ? "Close Debug" : "Verify Data"}
                    </Button>
                    <div className="flex gap-3 text-sm font-medium bg-background px-4 py-2 rounded-lg border shadow-sm">
                        <span className="text-muted-foreground">Portfolio Value:</span>
                        <span className="font-mono font-bold text-primary">₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-950 text-white border-slate-800 shadow-xl col-span-1 md:col-span-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-12 w-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            Total Equity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tracking-tighter">
                            ₹{totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-1 font-medium">
                            Unutilized Balance: ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Unrealized P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-mono tracking-tighter", unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {unrealizedPnL >= 0 ? '+' : ''}₹{unrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <Activity className="h-3 w-3" /> Real-time Yahoo Feed
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Realized P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
                            ₹{(realizedPnL || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium italic">Booked Profits/Losses</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Margin Blocked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tracking-tighter text-amber-600">
                            ₹{marginLocked.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Professional Margin System</div>
                    </CardContent>
                </Card>
            </div>

            {/* Holdings Table */}
            <Card className="shadow-2xl overflow-hidden border-t-0 rounded-xl">
                <div className="bg-slate-50 dark:bg-slate-800/20 border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                            <List className="h-5 w-5 text-primary" /> Active Holdings
                        </h3>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-border text-slate-500">
                                <tr className="text-left uppercase text-[10px] font-black tracking-widest">
                                    <th className="py-4 px-6">Instrument</th>
                                    <th className="py-4 px-6 text-right">Qty (Lots)</th>
                                    <th className="py-4 px-6 text-right">Avg Price</th>
                                    <th className="py-4 px-6 text-right">LTP</th>
                                    <th className="py-4 px-6 text-right hidden lg:table-cell">Entry Time</th>
                                    <th className="py-4 px-6 text-right hidden lg:table-cell">Duration</th>
                                    <th className="py-4 px-6 text-right">Net Value</th>
                                    <th className="py-4 px-6 text-right">Unrealized P&L</th>
                                    <th className="py-4 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {holdings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-400 font-medium tracking-tight whitespace-nowrap overflow-hidden">Your portfolio is empty. Take a trade to see it here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    holdings.map((stock: any) => {
                                        const isProfit = stock.pnl >= 0;
                                        const isFO = stock.is_fo;
                                        const units = Math.abs(stock.qty);
                                        const lots = stock.lot_size ? (units / stock.lot_size).toFixed(1) : '1';

                                        const entryDate = new Date(stock.entry_time);
                                        const entryString = stock.entry_time ? entryDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--';
                                        
                                        let durationString = '--';
                                        if (stock.entry_time) {
                                            const diffMs = new Date().getTime() - entryDate.getTime();
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMins / 60);
                                            const diffDays = Math.floor(diffHours / 24);
                                            
                                            if (diffDays > 0) durationString = `${diffDays}d ${diffHours % 24}h`;
                                            else if (diffHours > 0) durationString = `${diffHours}h ${diffMins % 60}m`;
                                            else durationString = `${diffMins}m`;
                                        }

                                        return (
                                            <tr key={stock.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 dark:text-slate-100 text-[13px] tracking-tight">{stock.symbol}</span>
                                                            {isFO && <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-black">F&O</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {stock.expiry_date && (
                                                                <Badge variant="outline" className="text-[9px] font-bold text-slate-500 uppercase border-slate-200 py-0 px-1">
                                                                    EXP: {new Date(stock.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                                </Badge>
                                                            )}
                                                            {stock.option_type && (
                                                                <span className={cn(
                                                                    "text-[10px] font-black px-1.5 rounded",
                                                                    stock.option_type === 'CE' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                                )}>
                                                                    {stock.strike_price} {stock.option_type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn("text-[13px]", stock.qty < 0 ? "text-rose-600" : "text-emerald-600")}>
                                                            {stock.qty < 0 ? '-' : '+'}{units}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {lots} Lots (Sz: {stock.lot_size})
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
                                                <td className="py-5 px-6 text-right font-mono text-[12px] text-slate-500 hidden lg:table-cell">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-slate-900 dark:text-slate-100">{stock.entry_time ? entryString.split(', ')[0] : '--'}</span>
                                                        <span className="text-[10px] text-slate-400">{stock.entry_time ? entryString.split(', ')[1] : ''}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono text-[12px] font-bold text-slate-500 hidden lg:table-cell">
                                                    {durationString}
                                                </td>
                                                <td className="py-5 px-6 text-right font-mono font-bold text-[13px] text-slate-900 dark:text-slate-100">
                                                    ₹{stock.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={cn("font-black font-mono text-[14px]", isProfit ? 'text-emerald-500' : 'text-rose-500')}>
                                                            {isProfit ? '+' : ''}₹{stock.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className={cn("text-[11px] font-bold font-mono opacity-80", isProfit ? 'text-emerald-600' : 'text-rose-600')}>
                                                            {isProfit ? '+' : ''}{stock.percent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-center">
                                                    <Link href={`/dashboard/trade?symbol=${stock.symbol}&action=sell`}>
                                                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-4 border-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all rounded-full">
                                                            EXIT
                                                        </Button>
                                                    </Link>
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

            {/* Hidden Professional Debug Panel */}
            {showDebug && holdings.length > 0 && (
                <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900/50 animate-in slide-in-from-top-2 duration-300">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500">
                            <Bug className="h-4 w-4" /> Market Data Transparency Panel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {holdings.map((stock: any) => (
                                <div key={`debug-${stock.symbol}`} className="bg-white dark:bg-slate-950 p-3 rounded-lg border shadow-sm text-[11px] font-mono leading-relaxed group">
                                    <div className="flex justify-between font-bold border-b pb-1.5 mb-2 group-hover:text-primary transition-colors">
                                        <span>{stock.symbol}</span>
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{stock.ticker}</Badge>
                                    </div>
                                    <div className="space-y-1 text-slate-500">
                                        <div className="flex justify-between">
                                            <span>API Ticker:</span>
                                            <span className="text-slate-900 dark:text-slate-300">{stock.ticker}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Live Market LTP:</span>
                                            <span className="text-emerald-600 font-bold">₹{stock.ltp.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lot Size (Multiplier):</span>
                                            <span className="text-slate-900 dark:text-slate-300">{stock.lot_size} units</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 font-bold">
                                            <span>Formula:</span>
                                            <span className="text-blue-600">({stock.ltp.toFixed(2)} - {stock.avg_price.toFixed(2)}) * {stock.qty} units</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
