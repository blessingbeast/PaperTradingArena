'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Activity, TrendingUp } from 'lucide-react';

interface HeroHeaderProps {
    totalTraders: number;
    totalVolume: number;
    topReturn: number;
}

export default function HeroHeader({ totalTraders, totalVolume, topReturn }: HeroHeaderProps) {
    const formatCurrencyCompact = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E232F] via-[#161B22] to-[#0D1117] border border-gray-800 shadow-2xl p-8 md:p-10 mb-8"
        >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
                {/* Left: Titles */}
                <div className="flex flex-col space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-semibold tracking-wide uppercase w-fit mb-2"
                    >
                        <Trophy className="w-3.5 h-3.5" /> Premium Arena
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                        Arena Leaderboard
                    </h1>
                    <p className="text-gray-400 text-lg flex items-center gap-2">
                        Compete with traders across India in real-time.
                    </p>
                </div>

                {/* Right: Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    {/* Stat 1 */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-center min-w-[140px]">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium uppercase tracking-wider">Active Traders</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">{totalTraders}</span>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-center min-w-[140px]">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium uppercase tracking-wider">Volume Traded</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">{formatCurrencyCompact(totalVolume)}</span>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-center min-w-[140px]">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium uppercase tracking-wider">Top Return</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-emerald-400">
                            +{topReturn.toFixed(1)}%
                        </span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
