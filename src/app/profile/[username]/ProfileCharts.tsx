'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Cell } from 'recharts';

interface Trade {
    created_at: string;
    realized_pnl?: number | null;
}

export default function ProfileCharts({ trades, initialEquity }: { trades: Trade[], initialEquity: number }) {
    // Generate mock equity curve from recent trades if historical data isn't perfect
    let currentEquity = initialEquity;

    // Sort trades oldest to newest for the chart
    const sortedTrades = [...trades].reverse();

    const equityData = sortedTrades.map(t => {
        const date = new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        // Reverse engineer equity backwards or forwards. Since we only have current equity,
        // this is a simplified visualization showing recent impacts.
        return {
            date,
            equity: currentEquity += (t.realized_pnl || 0)
        };
    });

    if (equityData.length === 0) {
        // Fallback flat line if no trades
        equityData.push({ date: 'Start', equity: initialEquity });
        equityData.push({ date: 'Now', equity: initialEquity });
    }

    // Monthly Returns Aggregation
    const monthlyMap = new Map<string, number>();
    trades.forEach(t => {
        const month = new Date(t.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + (t.realized_pnl || 0));
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, pnl]) => ({
        month,
        pnl
    })).reverse();

    if (monthlyData.length === 0) {
        monthlyData.push({ month: 'This Month', pnl: 0 });
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="h-64 border border-gray-800 rounded-xl bg-[#1E232F]/30 p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Equity Curve (Recent Trades)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityData}>
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E232F', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#60A5FA' }}
                            formatter={(value: number | undefined) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Equity']}
                        />
                        <Area type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="h-48 border border-gray-800 rounded-xl bg-[#1E232F]/30 p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Monthly P&L</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="month" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{ fill: '#2B313F' }}
                            contentStyle={{ backgroundColor: '#1E232F', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                            formatter={(value: number | undefined) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'P&L']}
                        />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                            {monthlyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
