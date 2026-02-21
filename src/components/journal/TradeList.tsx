import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Edit2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TradeListProps {
    entries: any[];
    onEdit: (entry: any) => void;
}

export function TradeList({ entries, onEdit }: TradeListProps) {

    if (!entries || entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
                <h3 className="text-lg font-medium">No Trades Journaled Yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Complete a buy and sell cycle to automatically see your trades recorded here.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Symbol</TableHead>
                        <TableHead>Date / Time</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Entry / Exit</TableHead>
                        <TableHead className="text-right">PnL</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.id} className="group">
                            <TableCell className="font-semibold">{entry.symbol}</TableCell>
                            <TableCell>
                                <div className="text-sm">{format(new Date(entry.exit_date), 'dd MMM yyyy')}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(entry.exit_date), 'HH:mm')}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={entry.side === 'LONG' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-500 border-rose-500/20 bg-rose-500/10'}>
                                    {entry.side}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{entry.qty}</TableCell>
                            <TableCell className="text-right">
                                <div className="text-sm">{formatCurrency(entry.entry_price)}</div>
                                <div className="text-xs text-muted-foreground">→ {formatCurrency(entry.exit_price)}</div>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${entry.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {entry.pnl > 0 ? '+' : ''}{formatCurrency(entry.pnl)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {entry.emotion_tag && <Badge variant="secondary" className="text-[10px] uppercase font-semibold">{entry.emotion_tag}</Badge>}
                                    {entry.mistake_tag && entry.mistake_tag !== 'None' && <Badge variant="destructive" className="text-[10px] uppercase bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">{entry.mistake_tag}</Badge>}

                                    {entry.notes && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="text-[10px] cursor-help">📝 Notes</Badge>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs whitespace-pre-wrap">
                                                    <p>{entry.notes}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onEdit(entry)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
