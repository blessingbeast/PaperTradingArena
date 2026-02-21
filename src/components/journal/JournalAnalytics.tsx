import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function JournalAnalytics({ data }: { data: any }) {

    if (!data) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total PnL</CardDescription>
                    <CardTitle className={`text-2xl ${data.total_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(data.total_pnl)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                    <p className="text-xs text-muted-foreground mt-1">{data.total_trades} total closed trades</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase tracking-wider font-semibold">Win Rate</CardDescription>
                    <CardTitle className="text-2xl">
                        {data.win_rate.toFixed(1)}%
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${data.win_rate}%` }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: `${100 - data.win_rate}%` }}></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase tracking-wider font-semibold">Avg Profit / Loss</CardDescription>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <span className="text-emerald-500">{formatCurrency(data.avg_profit)}</span>
                        <span className="text-muted-foreground text-sm font-normal">/</span>
                        <span className="text-rose-500">{formatCurrency(data.avg_loss)}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                    <p className="text-xs text-muted-foreground mt-1">Profit Factor: {data.profit_factor.toFixed(2)}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase tracking-wider font-semibold">Max Drawdown</CardDescription>
                    <CardTitle className="text-2xl text-rose-500">
                        -{formatCurrency(data.max_drawdown)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                    <p className="text-xs text-muted-foreground mt-1">Peak-to-trough decline</p>
                </CardContent>
            </Card>
        </div>
    );
}
