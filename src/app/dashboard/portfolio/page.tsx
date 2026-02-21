'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, List, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PortfolioPage() {
    const { balance, invested, currentValue, totalPnL, dayPnL, dayPnLPercent, holdings, loading } = usePortfolio();

    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading your portfolio...</p>
            </div>
        );
    }

    const totalEquity = balance + currentValue;
    const totalReturnPercent = invested > 0 ? (totalPnL / invested) * 100 : 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-muted-foreground">Manage your holdings and track performance</p>
                </div>
                <div className="flex gap-2 text-sm font-medium bg-muted px-4 py-2 rounded-lg border">
                    <span className="text-muted-foreground">Realized PnL:</span>
                    {/* Mocked realized PNL for now since API only calculates unrealized live PnL right now */}
                    <span className="text-foreground font-mono font-bold">₹0.00</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary text-primary-foreground border-primary shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary-foreground/80 font-medium text-sm flex items-center justify-between">
                            Total Equity
                            <Wallet className="h-4 w-4 opacity-70" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-mono tracking-tight">
                            ₹{totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-primary-foreground/80 text-xs mt-2 font-medium">
                            Invested Value: ₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-muted-foreground font-medium text-sm">Total Returns</CardTitle>
                        <div className={cn("p-1.5 rounded-full", totalPnL >= 0 ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive")}>
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold font-mono tracking-tight", totalPnL >= 0 ? 'text-profit' : 'text-destructive')}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={cn("text-sm mt-1 font-medium font-mono", totalPnL >= 0 ? 'text-profit' : 'text-destructive')}>
                            {totalPnL >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-muted-foreground font-medium text-sm">Day's PnL</CardTitle>
                        <div className={cn("p-1.5 rounded-full", dayPnL >= 0 ? "bg-profit/10 text-profit" : "bg-destructive/10 text-destructive")}>
                            {dayPnL >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold font-mono tracking-tight", dayPnL >= 0 ? 'text-profit' : 'text-destructive')}>
                            {dayPnL >= 0 ? '+' : ''}₹{dayPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={cn("text-sm mt-1 font-medium font-mono", dayPnL >= 0 ? 'text-profit' : 'text-destructive')}>
                            {dayPnL >= 0 ? '+' : ''}{dayPnLPercent.toFixed(2)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <List className="h-5 w-5 text-muted-foreground" /> Your Holdings
                    </CardTitle>
                    <CardDescription>
                        All shares currently held in your demat account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr className="text-left text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                                    <th className="py-3 px-6">Instrument</th>
                                    <th className="py-3 px-6 text-right">Qty</th>
                                    <th className="py-3 px-6 text-right">Avg. Cost</th>
                                    <th className="py-3 px-6 text-right">LTP</th>
                                    <th className="py-3 px-6 text-right">Cur. Value</th>
                                    <th className="py-3 px-6 text-right">P&L</th>
                                    <th className="py-3 px-6 text-right">Net Chg.</th>
                                    <th className="py-3 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {holdings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="flex flex-col items-center max-w-xs mx-auto">
                                                <Wallet className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                                <h3 className="font-semibold text-foreground mb-1">No Holdings Yet</h3>
                                                <p className="text-muted-foreground text-sm mb-4">You have not bought any stocks yet. Go to the Trade page to start investing.</p>
                                                <Link href="/dashboard/trade">
                                                    <Button variant="default" size="sm">Start Trading</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    holdings.map((stock) => {
                                        const ltp = stock.ltp || stock.avg_price;
                                        const currentValue = ltp * stock.qty;
                                        const pnl = stock.pnl || 0;
                                        const investedAmount = stock.invested || 0;
                                        const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;
                                        const isProfit = pnl >= 0;

                                        return (
                                            <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-4 px-6 font-semibold flex items-center gap-2">
                                                    <span className="text-foreground">{stock.symbol}</span>
                                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border uppercase">NSE</span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono">{stock.qty}</td>
                                                <td className="py-4 px-6 text-right font-mono">₹{stock.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                                <td className="py-4 px-6 text-right font-mono font-medium">₹{ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                                <td className="py-4 px-6 text-right font-mono text-muted-foreground">₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                                <td className={cn("py-4 px-6 text-right font-bold font-mono", isProfit ? 'text-profit' : 'text-destructive')}>
                                                    {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className={cn("py-4 px-6 text-right font-medium font-mono text-xs", isProfit ? 'text-profit' : 'text-destructive')}>
                                                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link href={`/dashboard/trade?symbol=${stock.symbol}&action=sell`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-xs px-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background hover:bg-destructive hover:text-white hover:border-destructive">
                                                            Exit
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
        </div>
    );
}
