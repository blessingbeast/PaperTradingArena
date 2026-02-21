import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MistakeSummary({ entries }: { entries: any[] }) {

    // Count mistakes
    const mistakeMap = new Map<string, number>();
    let totalTaggedMistakes = 0;

    entries.forEach(e => {
        if (e.mistake_tag && e.mistake_tag !== 'None') {
            const count = mistakeMap.get(e.mistake_tag) || 0;
            mistakeMap.set(e.mistake_tag, count + 1);
            totalTaggedMistakes++;
        }
    });

    if (mistakeMap.size === 0) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Mistake Summary</CardTitle>
                    <CardDescription>Track the reasons behind your losing trades.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground">No mistakes tagged yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Review your past trades and tag them to identify patterns.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort descending by count
    const sortedMistakes = Array.from(mistakeMap.entries()).sort((a, b) => b[1] - a[1]);

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle>Mistake Summary</CardTitle>
                <CardDescription>Track the reasons behind your losing trades.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedMistakes.map(([mistake, count], index) => {
                        const percentage = (count / totalTaggedMistakes) * 100;
                        return (
                            <div key={mistake} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{mistake}</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{count}</Badge>
                                    </div>
                                    <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    {/* Map colors based on rank: index 0 gets red, 1 gets orange, etc or just plain red since they are mistakes */}
                                    <div className="bg-rose-500 h-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
