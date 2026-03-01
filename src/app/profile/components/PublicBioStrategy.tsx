'use client';

import { BookOpen, Crosshair, Target, ShieldAlert, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Profile {
    bio?: string | null;
    strategy?: string | null;
    favorite_stocks?: string | null;
    risk_style?: string | null;
}

export default function PublicBioStrategy({ profile }: { profile: Profile }) {
    // We provide placeholder fallbacks if the user hasn't filled these out yet.
    // In a future DB migration, strategy, favorite_stocks, and risk_style columns can be added.
    const bioText = profile.bio || "This trader hasn't added a biography yet.";
    const strategyText = profile.strategy || "Price action and volume spread analysis focusing on high momentum breakouts in the NIFTY 50 and Bank NIFTY indices.";
    const favoriteStocks = profile.favorite_stocks || "HDFCBANK, RELIANCE, ICICIBANK, INFY";
    const riskStyle = profile.risk_style || "Aggressive Growth (2% Risk per trade)";

    return (
        <div className="bg-[#1E232F]/50 border border-gray-800 rounded-2xl shadow-xl backdrop-blur-md p-6 h-full flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Trader Profile & Strategy</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* About Me / Bio */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-2"
                >
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> About Me
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed bg-[#161B22]/50 p-4 rounded-xl border border-gray-800/50 min-h-[100px]">
                        {bioText}
                    </p>
                </motion.div>

                {/* Trading Strategy */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="space-y-2"
                >
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5" /> Core Strategy
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed bg-[#161B22]/50 p-4 rounded-xl border border-gray-800/50 min-h-[100px]">
                        {strategyText}
                    </p>
                </motion.div>

                {/* Favorite Stocks */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="space-y-2"
                >
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" /> Watchlist Favorites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {favoriteStocks.split(',').map(s => s.trim()).map((stock, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded-md">
                                {stock}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Risk Management */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="space-y-2"
                >
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Risk Methodology
                    </h4>
                    <p className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl inline-block">
                        {riskStyle}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
