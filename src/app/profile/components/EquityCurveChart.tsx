'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ComposedChart, Line } from 'recharts';
import { Maximize2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface Trade {
    created_at: string;
    realized_pnl?: number | null;
}

export default function EquityCurveChart({ trades, initialEquity, compact = false }: { trades: Trade[], initialEquity: number, compact?: boolean }) {
    const [timeframe, setTimeframe] = useState('All Time');
    const [showBenchmark, setShowBenchmark] = useState(false);

    // Generate equity curve from trades
    let currentEquity = initialEquity;
    const sortedTrades = [...trades].reverse();

    // Simulate benchmark data (NIFTY 50) and Drawdown
    let maxEquitySeen = initialEquity;

    const rawData = sortedTrades.map((t, idx) => {
        const date = new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        currentEquity += (t.realized_pnl || 0);

        if (currentEquity > maxEquitySeen) {
            maxEquitySeen = currentEquity;
        }

        // Drawdown is the difference between peak equity and current equity
        const drawdown = currentEquity - maxEquitySeen;

        // Simulated benchmark data tracking loosely with equity but with some noise
        const benchmarkProgress = initialEquity + (initialEquity * (idx * 0.005) * (Math.random() > 0.5 ? 1 : 0.8));

        return {
            date,
            equity: currentEquity,
            drawdown: drawdown, // Negative value
            benchmark: benchmarkProgress
        };
    });

    // Fallback if no trades
    const equityData = rawData.length > 0 ? rawData : [
        { date: 'Start', equity: initialEquity, drawdown: 0, benchmark: initialEquity },
        { date: 'Now', equity: initialEquity, drawdown: 0, benchmark: initialEquity }
    ];

    const formatCurrency = (val: number) => `₹${(val / 1000).toFixed(0)}k`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`w-full bg-white dark:bg-[#1E232F]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden flex flex-col ${compact ? 'h-[160px] border-none bg-transparent shadow-none p-0' : 'h-[500px]'}`}
        >
            {/* Header Toolbar (Hidden in Compact mode) */}
            {!compact && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#161B22]/50 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Performance Curve</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Track equity growth vs benchmark</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Benchmark Toggle */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showBenchmark}
                                    onChange={(e) => setShowBenchmark(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded bg-white dark:bg-[#2B313F] border-gray-300 dark:border-gray-700 text-blue-600 dark:text-blue-500 focus:ring-0 focus:ring-offset-0"
                                />
                                NIFTY 50
                            </label>
                        </div>

                        {/* Timeframe Chips */}
                        <div className="flex bg-gray-100 dark:bg-[#0F172A] p-1 rounded-lg border border-gray-200 dark:border-gray-800">
                            {['Daily', 'Weekly', 'Monthly', 'All Time'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setTimeframe(p)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === p ? 'bg-white dark:bg-[#2B313F] text-blue-600 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button className="hidden md:flex p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-white bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-lg transition-colors">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className={`flex-1 relative ${compact ? 'p-0' : 'p-6'}`}>
                {/* Background Grid Styling */}
                {!compact && <div className="absolute inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] opacity-10 pointer-events-none" />}

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={equityData} margin={{ top: 10, right: 0, left: compact ? 0 : -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {!compact && <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.4} />}
                        {!compact && (
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                        )}
                        {!compact && (
                            <YAxis
                                yAxisId="left"
                                domain={['auto', 'auto']}
                                stroke="#6B7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCurrency}
                            />
                        )}
                        {!compact && (
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}
                                formatter={(value: number | undefined, name: string | undefined) => {
                                    if (value === undefined) return ['', name || ''];
                                    if (name === 'drawdown') return [`-₹${Math.abs(value).toLocaleString('en-IN')}`, 'Drawdown'];
                                    return [`₹${value.toLocaleString('en-IN')}`, (name || '').charAt(0).toUpperCase() + (name || '').slice(1)];
                                }}
                            />
                        )}

                        {/* Reference Line for Base Equity */}
                        {!compact && <ReferenceLine y={initialEquity} yAxisId="left" stroke="#4B5563" strokeDasharray="3 3" opacity={0.5} />}

                        {/* Benchmark Line (Optional) */}
                        {showBenchmark && !compact && (
                            <Line yAxisId="left" type="monotone" dataKey="benchmark" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" name="NIFTY 50" />
                        )}

                        {/* Drawdown Area */}
                        {!compact && <Area yAxisId="left" type="step" dataKey="drawdown" stroke="#EF4444" strokeWidth={1} fillOpacity={1} fill="url(#colorDrawdown)" opacity={0.6} name="drawdown" />}

                        {/* Main Equity Area */}
                        <Area yAxisId={compact ? undefined : "left"} type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={compact ? 2 : 3} fillOpacity={1} fill="url(#colorEquity)" name="equity" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
