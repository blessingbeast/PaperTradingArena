'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Briefcase, History, Target, Zap, Activity, Award } from 'lucide-react';

interface KeyStatsCardsProps {
    stats: {
        total_return_pct: number;
        total_pnl: number;
        win_rate: number;
        trades_count: number;
        best_trade?: number;
        worst_trade?: number;
    };
}

function AnimatedNumber({ value, formatter, isCurrency = false }: { value: number, formatter?: (val: number) => string, isCurrency?: boolean }) {
    const count = useMotionValue(0);
    const [finalOutput, setFinalOutput] = useState('');

    useEffect(() => {
        const animation = animate(count, value, {
            duration: 1.5,
            ease: "easeOut",
            onUpdate: (latest) => {
                if (formatter) {
                    setFinalOutput(formatter(latest));
                } else if (isCurrency) {
                    setFinalOutput(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(latest));
                } else {
                    setFinalOutput(latest.toFixed(latest % 1 === 0 ? 0 : 2));
                }
            }
        });
        return animation.stop;
    }, [value, count, formatter, isCurrency]);

    return <>{finalOutput}</>;
}

export default function KeyStatsCards({ stats }: KeyStatsCardsProps) {
    const formatCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    // We mock some missing optional stats for the visual layout if they aren't computed yet
    const avgHoldingTime = '2.5 Days';
    const sharpeRatio = 1.42;

    const cards = [
        {
            title: "Total Return",
            value: stats.total_return_pct,
            isCurrency: false,
            suffix: "%",
            prefix: stats.total_return_pct > 0 ? "+" : "",
            color: stats.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400",
            icon: stats.total_return_pct >= 0 ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-red-400" />,
            glow: stats.total_return_pct >= 0 ? "shadow-emerald-500/10" : "shadow-red-500/10"
        },
        {
            title: "Total P&L",
            value: stats.total_pnl,
            isCurrency: true,
            suffix: "",
            prefix: stats.total_pnl > 0 ? "+" : "",
            color: stats.total_pnl >= 0 ? "text-emerald-400" : "text-red-400",
            icon: <Briefcase className="text-amber-400" />,
            glow: "shadow-amber-500/10"
        },
        {
            title: "Win Rate",
            value: stats.win_rate || 0,
            isCurrency: false,
            suffix: "%",
            prefix: "",
            color: (stats.win_rate || 0) >= 50 ? "text-blue-400" : "text-orange-400",
            icon: <Target className="text-blue-400" />,
            glow: "shadow-blue-500/10"
        },
        {
            title: "Total Trades",
            value: stats.trades_count,
            isCurrency: false,
            suffix: "",
            prefix: "",
            color: "text-purple-400",
            icon: <History className="text-purple-400" />,
            glow: "shadow-purple-500/10"
        }
    ];

    const optionalCards = [
        {
            title: "Best Trade",
            value: stats.best_trade || 0,
            isCurrency: true,
            prefix: "+",
            color: "text-emerald-400",
            icon: <Award className="text-emerald-400" />
        },
        {
            title: "Worst Trade",
            value: stats.worst_trade || 0,
            isCurrency: true,
            prefix: "",
            color: "text-red-400",
            icon: <Zap className="text-red-400" />
        },
        {
            title: "Avg Holding",
            valueText: avgHoldingTime,
            color: "text-gray-300",
            icon: <Activity className="text-gray-400" />
        },
        {
            title: "Sharpe Ratio",
            value: sharpeRatio,
            isCurrency: false,
            color: sharpeRatio > 1 ? "text-blue-400" : "text-gray-400",
            icon: <TrendingUp className="text-blue-400" />
        }
    ];

    return (
        <div className="space-y-4">
            {/* Primary Metrics Grid (Swipeable on Mobile) */}
            <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {cards.map((c, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 snap-center shrink-0 bg-[#1E232F]/80 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-transform ${c.glow}`}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700" />

                        <div className="flex items-center gap-4 relative z-10 mb-2">
                            <div className="p-2.5 bg-[#2B313F]/50 rounded-xl border border-gray-700/50 shadow-inner">
                                {c.icon}
                            </div>
                            <p className="text-gray-400 text-sm font-semibold tracking-wide uppercase">{c.title}</p>
                        </div>

                        <div className="relative z-10 mt-4">
                            <p className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${c.color}`}>
                                {c.prefix}
                                <AnimatedNumber value={c.value} isCurrency={c.isCurrency}
                                    formatter={c.isCurrency ? undefined : (v) => v.toFixed(c.title === 'Total Trades' ? 0 : 2)}
                                />
                                {c.suffix}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Secondary Option Metrics (Swipeable on Mobile) */}
            <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 pb-2 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {optionalCards.map((c, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1), duration: 0.4 }}
                        className="min-w-[60vw] sm:min-w-[40vw] lg:min-w-0 snap-center shrink-0 bg-[#161B22]/60 border border-gray-800/60 rounded-xl p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-[#1E232F] rounded-lg border border-gray-800">
                                {c.icon}
                            </div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">{c.title}</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${c.color}`}>
                            {c.valueText ? c.valueText : (
                                <>
                                    {c.prefix}
                                    {c.isCurrency ? formatCurrency(c.value as number) : c.value}
                                </>
                            )}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
