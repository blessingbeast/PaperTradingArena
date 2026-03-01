'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface Trade {
    type: string;
    symbol: string;
    realized_pnl?: number | null;
}

export default function TradeAnalyticsGrid({ trades }: { trades: Trade[] }) {
    // 1. Profit vs Loss Trades Count
    const winningTrades = trades.filter(t => (t.realized_pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.realized_pnl || 0) < 0).length;
    const breakevenTrades = trades.filter(t => (t.realized_pnl || 0) === 0).length;

    const winLossData = [
        { name: 'Profitable', value: winningTrades, color: '#10B981' },
        { name: 'Loss-Making', value: losingTrades, color: '#EF4444' },
        { name: 'Breakeven', value: breakevenTrades, color: '#6B7280' }
    ].filter(d => d.value > 0);

    // 2. Long vs Short Trades
    const longTrades = trades.filter(t => t.type.toUpperCase() === 'BUY').length;
    const shortTrades = trades.filter(t => t.type.toUpperCase() === 'SELL').length;

    const longShortData = [
        { name: 'Long (Buy)', value: longTrades, color: '#3B82F6' },
        { name: 'Short (Sell)', value: shortTrades, color: '#F59E0B' }
    ].filter(d => d.value > 0);

    // 3. Asset Allocation (Equity vs F&O)
    // We differentiate F&O based on standard NSE syntax (contains numbers indicative of expiry/strike)
    const isOptions = (sym: string) => /\d{5}(CE|PE)$/i.test(sym) || /FUT$/i.test(sym);
    let equityPnl = 0;
    let fnoPnl = 0;

    trades.forEach(t => {
        if (isOptions(t.symbol)) fnoPnl += (t.realized_pnl || 0);
        else equityPnl += (t.realized_pnl || 0);
    });

    const assetData = [
        { name: 'Stocks', pnl: equityPnl },
        { name: 'F&O', pnl: fnoPnl }
    ];

    // 4. Monthly P&L (Borrowed from legacy ProfileCharts)
    const monthlyMap = new Map<string, number>();
    trades.forEach(t => {
        // We ensure created_at exists. Fallback if undefined.
        if (!(t as any).created_at) return;
        const month = new Date((t as any).created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + (t.realized_pnl || 0));
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, pnl]) => ({
        month,
        pnl
    })).reverse();

    if (monthlyData.length === 0) {
        monthlyData.push({ month: 'This Month', pnl: 0 });
    }

    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    // Custom Tooltip for Pie
    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#111827] border border-gray-700 p-2 rounded-lg shadow-xl text-xs font-semibold text-white">
                    {payload[0].name}: {payload[0].value} Trades
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Profit vs Loss Pie */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-[#1E232F]/50 border border-gray-800 rounded-xl p-5 shadow-lg backdrop-blur-sm h-64 flex flex-col"
            >
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Win / Loss Ratio</h3>
                <div className="flex-1 w-full relative">
                    {winLossData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={winLossData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {winLossData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No P&L data</div>
                    )}
                </div>
            </motion.div>

            {/* Long vs Short Pie */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-[#1E232F]/50 border border-gray-800 rounded-xl p-5 shadow-lg backdrop-blur-sm h-64 flex flex-col"
            >
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Long vs Short Distribution</h3>
                <div className="flex-1 w-full relative">
                    {longShortData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={longShortData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={70}
                                    dataKey="value"
                                    stroke="#1E232F"
                                    strokeWidth={2}
                                >
                                    {longShortData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No trade data</div>
                    )}
                </div>
            </motion.div>

            {/* Monthly P&L Bar Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-[#1E232F]/50 border border-gray-800 rounded-xl p-5 shadow-lg backdrop-blur-sm h-64 flex flex-col md:col-span-2 relative overflow-hidden group"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-sm font-semibold text-gray-400 mb-4 z-10">Monthly P&L Consistency</h3>
                <div className="flex-1 w-full z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.5} />
                            <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#2B313F', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
                                formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Profit/Loss']}
                            />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {monthlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
