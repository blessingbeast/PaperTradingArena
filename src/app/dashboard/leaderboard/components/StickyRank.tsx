'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, Minus } from 'lucide-react';
import { LeaderboardUser } from '../page';
import { useState } from 'react';

interface StickyRankProps {
    currentUser: LeaderboardUser | undefined;
    onViewProfile: (username: string) => void;
}

export default function StickyRank({ currentUser, onViewProfile }: StickyRankProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!currentUser) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 group"
            >
                {isMinimized ? (
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="bg-[#1A1F2C]/90 backdrop-blur-2xl border border-gray-700/60 px-4 py-2.5 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex flex-row items-center gap-2 hover:bg-[#1A1F2C] transition-colors"
                    >
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Rank</span>
                        <span className="text-sm font-black text-white">#{currentUser.rank}</span>
                    </button>
                ) : (
                    <div className="relative bg-[#1A1F2C]/90 backdrop-blur-2xl border border-gray-700/60 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 min-w-[240px] transition-transform duration-300 hover:-translate-y-2">

                        {/* Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-800/60">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Your Rank</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-white">#{currentUser.rank}</span>
                                <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-medium">Return</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-bold text-sm ${currentUser.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {currentUser.returnPct > 0 ? '+' : ''}{currentUser.returnPct.toFixed(2)}%
                                    </span>
                                    {currentUser.returnPct >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500/70" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500/70" />}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500 font-medium">Total P&L</span>
                                <span className={`font-bold text-sm ${currentUser.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {currentUser.pnl > 0 ? '+' : ''}{formatCurrency(currentUser.pnl)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onViewProfile(currentUser.username)}
                            className="mt-2 w-full flex items-center justify-between px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        >
                            View Profile
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Glow Effects */}
                        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[18px] blur-sm opacity-50 pointer-events-none -z-10" />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
