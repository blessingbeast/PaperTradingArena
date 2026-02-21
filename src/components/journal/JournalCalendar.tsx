import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function JournalCalendar({ entries }: { entries: any[] }) {
    // Map entries by date string "YYYY-MM-DD"
    const entryMap = new Map<string, { pnl: number, count: number }>();

    entries.forEach(e => {
        const dateStr = new Date(e.exit_date).toISOString().split('T')[0];
        const existing = entryMap.get(dateStr) || { pnl: 0, count: 0 };
        entryMap.set(dateStr, {
            pnl: existing.pnl + Number(e.pnl),
            count: existing.count + 1
        });
    });

    const modifiers = {
        profitable: (date: Date) => {
            const dateStr = date.toISOString().split('T')[0];
            const data = entryMap.get(dateStr);
            return !!data && data.pnl > 0;
        },
        losing: (date: Date) => {
            const dateStr = date.toISOString().split('T')[0];
            const data = entryMap.get(dateStr);
            return !!data && data.pnl < 0;
        },
        breakeven: (date: Date) => {
            const dateStr = date.toISOString().split('T')[0];
            const data = entryMap.get(dateStr);
            return !!data && data.pnl === 0;
        }
    };

    const modifiersStyles = {
        profitable: { backgroundColor: 'oklch(0.7 0.1 150)', color: 'white' }, // Custom green shade matching our theme
        losing: { backgroundColor: 'oklch(0.6 0.2 20)', color: 'white' },      // Custom red shade
        breakeven: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle>Trading Calendar</CardTitle>
                <CardDescription>Visual heatmap of your daily performance</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-0 pb-6">
                <Calendar
                    mode="single"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    className="border rounded-md pointer-events-none" // Make read-only visually
                />
            </CardContent>
            <div className="flex justify-center gap-4 pb-6 text-sm">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Profit</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Loss</div>
            </div>
        </Card>
    );
}
