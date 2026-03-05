
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderboardPage() {
    // Mock Data
    const leaders = [
        { rank: 1, name: "TraderKing", return: "+154%", pnl: "₹15.4L" },
        { rank: 2, name: "NiftyMaster", return: "+98%", pnl: "₹9.8L" },
        { rank: 3, name: "BullRun_99", return: "+45%", pnl: "₹4.5L" },
        { rank: 4, name: "BearTrap", return: "+32%", pnl: "₹3.2L" },
        { rank: 5, name: "StockSniper", return: "+21%", pnl: "₹2.1L" },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-12 flex-1">
                <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Top Traders</h1>

                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Weekly Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b dark:border-gray-800 text-left">
                                        <th className="py-3 px-4 font-semibold text-muted-foreground">Rank</th>
                                        <th className="py-3 px-4 font-semibold text-muted-foreground">Username</th>
                                        <th className="py-3 px-4 font-semibold text-muted-foreground">Return %</th>
                                        <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Total PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaders.map((user) => (
                                        <tr key={user.rank} className="border-b dark:border-gray-800 hover:bg-muted/50">
                                            <td className="py-4 px-4 font-medium">#{user.rank}</td>
                                            <td className="py-4 px-4 font-bold">{user.name}</td>
                                            <td className="py-4 px-4 text-profit font-bold">{user.return}</td>
                                            <td className="py-4 px-4 text-right font-mono">{user.pnl}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
