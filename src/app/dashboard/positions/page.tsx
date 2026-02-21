'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PositionsPage() {
    const { holdings, loading } = usePortfolio();

    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading your positions...</p>
            </div>
        );
    }

    // In a real app we'd filter for intraday vs delivery. For this simulator, 
    // we simply show open holdings here as positions.
    const positions = holdings;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
                    <p className="text-muted-foreground">Manage your open trades</p>
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Briefcase className="h-5 w-5 text-muted-foreground" /> Open Positions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr className="text-left text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                                    <th className="py-3 px-6">Product</th>
                                    <th className="py-3 px-6">Instrument</th>
                                    <th className="py-3 px-6 text-right">Qty.</th>
                                    <th className="py-3 px-6 text-right">Avg.</th>
                                    <th className="py-3 px-6 text-right">LTP</th>
                                    <th className="py-3 px-6 text-right">P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {positions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center bg-muted/10">
                                            <div className="flex flex-col items-center max-w-sm mx-auto">
                                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                                    <Briefcase className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                                <h3 className="font-semibold text-lg text-foreground mb-2">You don't have any open positions</h3>
                                                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                                                    Positions from intraday and F&O trades will appear here. Go to the Trade tab to place new orders.
                                                </p>
                                                <Link href="/dashboard/trade">
                                                    <Button className="h-12 px-8 font-bold shadow-md">Get Started</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    positions.map((stock) => {
                                        const ltp = stock.ltp || stock.avg_price;
                                        const pnl = stock.pnl || 0;
                                        const isProfit = pnl >= 0;

                                        return (
                                            <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    <span className="bg-secondary px-2 py-1 rounded">MIS</span>
                                                </td>
                                                <td className="py-4 px-6 font-semibold flex items-center gap-2">
                                                    <span className="text-foreground">{stock.symbol}</span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono text-[13px]">{stock.qty}</td>
                                                <td className="py-4 px-6 text-right font-mono text-[13px]">₹{stock.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                                <td className="py-4 px-6 text-right font-mono text-[13px] font-medium">₹{ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                                <td className={cn("py-4 px-6 text-right font-bold font-mono", isProfit ? 'text-profit' : 'text-destructive')}>
                                                    {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
