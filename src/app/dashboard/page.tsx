'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp, RefreshCw, DatabaseBackup, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { user } = useAuth();
    const { balance, invested, currentValue, totalPnL, dayPnL, dayPnLPercent, marginLocked, holdings, loading, refresh } = usePortfolio();
    const [refreshing, setRefreshing] = useState(false);

    // Mock Historical Data for Charts based on current portfolio value
    const { mockEquityData, mockDailyPnL } = useMemo(() => {
        const totalEquity = balance + marginLocked + dayPnL;
        const eData = [];
        const pData = [];

        let rollingEquity = totalEquity - (totalPnL || 0); // Start from original capital
        const days = 30;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Generate some random walk noise for history, converging to current equity
            const noise = i === 0 ? 0 : (Math.random() - 0.45) * 5000;
            rollingEquity += noise;

            eData.push({
                date: dateStr,
                equity: i === 0 ? totalEquity : Math.max(0, rollingEquity)
            });

            // Daily PnL Mock
            if (i < 7) {
                pData.push({
                    day: dateStr,
                    pnl: i === 0 ? dayPnL : noise
                });
            }
        }

        return { mockEquityData: eData, mockDailyPnL: pData };
    }, [balance, currentValue, totalPnL, dayPnL]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setTimeout(() => setRefreshing(false), 500);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading your portfolio...</p>
            </div>
        );
    }

    const totalEquity = balance + marginLocked + dayPnL;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.email?.split('@')[0] || 'Trader'}!</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="flex-1 sm:flex-none">
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">₹{totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Balance: ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invested Value</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1 tracking-tight">
                            ₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })} original
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Day PnL</CardTitle>
                        <div className={cn("p-1.5 rounded-full", dayPnL >= 0 ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive")}>
                            {dayPnL >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-mono", dayPnL >= 0 ? "text-profit" : "text-destructive")}>
                            {dayPnL >= 0 ? '+' : ''}₹{dayPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <p className={cn("text-xs mt-1 font-medium", dayPnL >= 0 ? "text-profit/80" : "text-destructive/80")}>
                            {dayPnL >= 0 ? '+' : ''}{dayPnLPercent.toFixed(2)}% today
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
                        <div className={cn("p-1.5 rounded-full", totalPnL >= 0 ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive")}>
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-mono", totalPnL >= 0 ? "text-profit" : "text-destructive")}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All time profit/loss
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-5 hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader>
                        <CardTitle>Equity Curve</CardTitle>
                        <CardDescription>Your portfolio performance over the last 30 days (Simulated).</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockEquityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickMargin={10}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Equity']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="equity"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorEquity)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Daily PnL</CardTitle>
                        <CardDescription>Last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockDailyPnL}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                        tickMargin={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: any) => [`${Number(value) > 0 ? '+' : ''}₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'PnL']}
                                    />
                                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                        {mockDailyPnL.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Positions Table */}
            <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader>
                    <CardTitle>Your Active Holdings</CardTitle>
                    <CardDescription>Currently open positions and real-time PnL.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr className="text-left text-muted-foreground uppercase text-xs tracking-wider">
                                    <th className="py-3 px-6 font-medium">Symbol</th>
                                    <th className="py-3 px-6 font-medium text-right">Qty</th>
                                    <th className="py-3 px-6 font-medium text-right">Avg. Price</th>
                                    <th className="py-3 px-6 font-medium text-right">LTP</th>
                                    <th className="py-3 px-6 font-medium text-right">PnL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {holdings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <p className="text-muted-foreground mb-2">No active positions found.</p>
                                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/trade'}>
                                                Start Trading
                                            </Button>
                                        </td>
                                    </tr>
                                ) : holdings.map((pos) => (
                                    <tr key={pos.symbol} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-6 font-semibold">{pos.symbol}</td>
                                        <td className="py-4 px-6 text-right font-mono">{pos.qty}</td>
                                        <td className="py-4 px-6 text-right font-mono">₹{pos.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-6 text-right font-mono">₹{(pos.ltp || pos.avg_price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td className={cn(
                                            "py-4 px-6 text-right font-bold flex flex-col items-end",
                                            (pos.pnl || 0) >= 0 ? 'text-profit' : 'text-destructive'
                                        )}>
                                            <span className="font-mono">
                                                {(pos.pnl || 0) >= 0 ? '+' : ''}₹{(pos.pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </span>
                                            {(pos.invested || 0) > 0 && (
                                                <span className="text-[10px] opacity-80 font-mono">
                                                    {(pos.pnl || 0) >= 0 ? '+' : ''}{(((pos.pnl || 0) / (pos.invested || 1)) * 100).toFixed(2)}%
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
