'use client';

import { motion } from 'framer-motion';
import { Medal } from 'lucide-react';

export interface LeaderboardUser {
    rank: number;
    userId: string;
    username: string;
    avatar: string | null;
    country: string | null;
    equity: number;
    pnl: number;
    returnPct: number;
    trades: number;
    winRate: number;
    stockPnl: number;
    fnoPnl: number;
    badges?: string[];
}

interface TopPodiumProps {
    top3: LeaderboardUser[];
    onProfileClick: (username: string) => void;
}

export default function TopPodium({ top3, onProfileClick }: TopPodiumProps) {
    if (!top3 || top3.length === 0) return null;

    // Desktop: 2, 1, 3
    // Mobile: 1, 2, 3 (Horizontal scroll)
    const renderCard = (user: LeaderboardUser, type: 'gold' | 'silver' | 'bronze', mobileOrder: number, desktopOrder: number) => {
        const isGold = type === 'gold';

        // Premium styling configurations
        const bgConfig = {
            gold: 'bg-[#1E232F]/95 border-yellow-500/40 shadow-[0_0_30px_rgba(250,204,21,0.15)] z-20',
            silver: 'bg-[#1E232F]/95 border-gray-400/40 shadow-[0_0_20px_rgba(148,163,184,0.1)] z-10',
            bronze: 'bg-[#1E232F]/95 border-orange-800/50 shadow-[0_0_20px_rgba(194,65,12,0.1)] z-0'
        };

        const iconColor = {
            gold: 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]',
            silver: 'text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]',
            bronze: 'text-orange-500 drop-shadow-[0_0_8px_rgba(194,65,12,0.5)]'
        };

        const sizeClasses = isGold
            ? 'w-72 md:scale-110 md:-translate-y-6'
            : 'w-64 opacity-90 hover:opacity-100';

        return (
            <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: isGold ? 0.2 : (type === 'silver' ? 0.3 : 0.4),
                    type: "spring", stiffness: 100
                }}
                className={`flex-shrink-0 relative flex flex-col items-center ${bgConfig[type]} border rounded-2xl p-6 ${sizeClasses} transition-all duration-500 hover:-translate-y-4 backdrop-blur-xl`}
                style={{
                    order: mobileOrder
                }}
            >
                {/* Desktop Absolute Ordering via Tailwind */}
                <style jsx>{`
                    @media (min-width: 768px) {
                        div { order: ${desktopOrder} !important; }
                    }
                `}</style>

                {/* Crown/Medal Icon */}
                <div className={`absolute -top-7 ${isGold ? 'animate-bounce' : ''}`}>
                    <Medal className={`w-14 h-14 ${iconColor[type]}`} />
                </div>

                {/* Avatar */}
                <div className={`mt-5 w-20 h-20 rounded-full overflow-hidden border-4 flex-shrink-0 ${isGold ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : (type === 'silver' ? 'border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.4)]' : 'border-orange-500 shadow-[0_0_15px_rgba(194,65,12,0.4)]')} flex items-center justify-center bg-[#0D1117] transition-transform duration-300 hover:scale-110`}>
                    {user.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-gray-100 to-gray-500">
                            {user.username.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Username & Country */}
                <h3 className="mt-4 font-black text-xl text-white truncate w-full text-center flex items-center justify-center gap-2">
                    {user.username}
                    {user.country && (
                        <span className="text-base" title={user.country}>
                            {getFlagEmoji(user.country)}
                        </span>
                    )}
                </h3>

                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        {user.badges.slice(0, 2).map(b => (
                            <span key={b} title={b} className={`text-[10px] px-2 py-0.5 rounded-full flex items-center font-bold tracking-wider uppercase
                                ${isGold ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : 'bg-gray-800/80 text-gray-300 border border-gray-700'}`}>
                                <Medal className="w-3 h-3 mr-1 opacity-70" /> {b}
                            </span>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="mt-5 w-full bg-[#161B22]/80 rounded-xl p-3 border border-gray-800 space-y-2">
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-400 font-medium tracking-wide border-b border-dashed border-gray-700 pb-0.5">RANK</span>
                        <span className={`font-black text-sm drop-shadow-sm ${isGold ? 'text-yellow-400' : 'text-gray-100'}`}>#{user.rank}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-400 font-medium tracking-wide border-b border-dashed border-gray-700 pb-0.5">RETURN</span>
                        <span className={`font-black text-sm drop-shadow-sm ${user.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {user.returnPct > 0 ? '+' : ''}{user.returnPct.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-400 font-medium tracking-wide border-b border-dashed border-gray-700 pb-0.5">TOTAL P&L</span>
                        <span className={`font-black text-sm drop-shadow-sm ${user.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(user.pnl / 1000).toFixed(1)}k
                        </span>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onProfileClick(user.username);
                    }}
                    className={`mt-5 w-full py-2.5 text-xs font-black tracking-widest uppercase rounded-xl transition-all border 
                        ${isGold
                            ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-400 border-yellow-500/20 hover:border-yellow-500/40 shadow-[0_0_10px_rgba(250,204,21,0.1)]'
                            : 'bg-[#2B313F]/50 text-gray-300 hover:bg-[#2B313F] hover:text-white border-gray-700 hover:border-gray-500 shadow-sm'}`}
                >
                    View Profile
                </button>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-row overflow-x-auto md:overflow-visible md:justify-center items-end gap-6 md:gap-8 pb-8 md:pb-12 pt-10 px-4 scrollbar-hide md:min-h-[400px]">
            {top3[1] && renderCard(top3[1], 'silver', 2, 1)}
            {top3[0] && renderCard(top3[0], 'gold', 1, 2)}
            {top3[2] && renderCard(top3[2], 'bronze', 3, 3)}
        </div>
    );
}

// Helper to convert country name to flag emoji
function getFlagEmoji(countryName: string) {
    const map: Record<string, string> = {
        'India': '🇮🇳',
        'United States': '🇺🇸',
        'United Kingdom': '🇬🇧',
        'Canada': '🇨🇦',
        'Australia': '🇦🇺',
        'Singapore': '🇸🇬',
        'United Arab Emirates': '🇦🇪',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Japan': '🇯🇵'
    };
    return map[countryName] || '🌍';
}
