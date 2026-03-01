'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Target, Activity, Award, UserPlus } from 'lucide-react';

interface QuickProfile {
    profile: {
        id: string;
        username: string;
        bio: string | null;
        avatar_url: string | null;
        country: string | null;
    };
    stats: {
        win_rate: number;
        trades_count: number;
        total_pnl: number;
        total_return_pct: number;
    };
    recentTrades: {
        symbol: string;
        type: string;
        status: string;
        created_at: string;
        avg_price: number;
    }[];
    favStocks: string[];
}

interface ProfilePreviewModalProps {
    username: string | null;
    onClose: () => void;
    onViewFullProfile: (username: string) => void;
}

export default function ProfilePreviewModal({ username, onClose, onViewFullProfile }: ProfilePreviewModalProps) {
    const [data, setData] = useState<QuickProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!username) return;

        const fetchQuickView = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/profile/${username}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error('Failed to fetch quick view', e);
            } finally {
                setLoading(false);
            }
        };

        fetchQuickView();
    }, [username]);

    if (!username) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative w-full max-w-md bg-[#161B22] border border-gray-700/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden"
                >
                    {/* Header Banner - Abstract Gradient */}
                    <div className="h-28 w-full bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-rose-600/30 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {loading || !data ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="px-6 pb-6 relative z-10 -mt-12">
                            {/* Avatar & Basic Info */}
                            <div className="flex justify-between items-end">
                                <div className="w-24 h-24 rounded-full border-4 border-[#161B22] bg-[#1E232F] shadow-xl overflow-hidden flex items-center justify-center">
                                    {data.profile.avatar_url ? (
                                        <img src={data.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-gray-500">{data.profile.username.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-colors">
                                        <UserPlus className="w-3.5 h-3.5" /> Follow
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3">
                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                    {data.profile.username}
                                    {data.profile.country && <span className="text-lg">{getFlagEmoji(data.profile.country)}</span>}
                                </h2>
                                {data.profile.bio && (
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{data.profile.bio}</p>
                                )}
                            </div>

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mt-6">
                                <div className="bg-[#1A1F2C] p-3 rounded-2xl border border-gray-800">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                                        <Target className="w-3 h-3 text-purple-400" /> Win Rate
                                    </div>
                                    <span className="font-bold text-gray-200">
                                        {data.stats.win_rate > 0 ? `${data.stats.win_rate.toFixed(1)}%` : '-'}
                                    </span>
                                </div>
                                <div className="bg-[#1A1F2C] p-3 rounded-2xl border border-gray-800">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                                        <Award className="w-3 h-3 text-yellow-400" /> Return
                                    </div>
                                    <span className={`font-bold ${data.stats.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {data.stats.total_return_pct > 0 ? '+' : ''}{data.stats.total_return_pct.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="bg-[#1A1F2C] p-3 rounded-2xl border border-gray-800">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                                        <Activity className="w-3 h-3 text-blue-400" /> Trades
                                    </div>
                                    <span className="font-bold text-gray-200">{data.stats.trades_count}</span>
                                </div>
                            </div>

                            {/* Mini Equity Sparkline (Simulated based on Return) */}
                            <div className="mt-6 bg-[#1A1F2C] rounded-2xl border border-gray-800 p-4">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">P&L Heatmap</h4>
                                <div className="w-full h-12 opacity-80 pointer-events-none">
                                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                        {data.stats.total_return_pct >= 0 ? (
                                            <path d="M0,20 Q10,18 20,15 T40,12 T60,5 T80,10 T100,2" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                                        ) : (
                                            <path d="M0,2 Q10,5 20,12 T40,15 T60,18 T80,10 T100,20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                                        )}
                                    </svg>
                                </div>
                            </div>

                            {/* Recent Trades Snippet */}
                            {data.recentTrades && data.recentTrades.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recent Activity</h4>
                                    <div className="flex flex-col gap-1.5">
                                        {data.recentTrades.slice(0, 3).map((trade, i) => (
                                            <div key={i} className="flex justify-between items-center bg-[#1A1F2C] px-3 py-2 rounded-lg border border-gray-800/50">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${trade.type === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                        {trade.type}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-300">{trade.symbol}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 font-mono">₹{trade.avg_price.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fav Stocks Tags */}
                            {data.favStocks && data.favStocks.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Favorite Assets</h4>
                                    <div className="flex gap-2">
                                        {data.favStocks.map(stock => (
                                            <span key={stock} className="text-xs px-2.5 py-1 bg-[#1A1F2C] text-gray-400 border border-gray-800 rounded-md">
                                                {stock}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => onViewFullProfile(username)}
                                className="mt-8 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider uppercase text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                            >
                                View Detailed Analytics
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

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
