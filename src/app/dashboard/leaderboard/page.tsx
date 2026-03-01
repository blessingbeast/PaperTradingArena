'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Search, TrendingUp, Medal, ShieldAlert, Users, TrendingDown } from 'lucide-react';
import HeroHeader from './components/HeroHeader';
import TopPodium from './components/TopPodium';
import StickyRank from './components/StickyRank';
import ProfilePreviewModal from './components/ProfilePreviewModal';
import { createClient } from '@/lib/supabase/client';

export interface LeaderboardUser {
    rank: number;
    userId: string;
    username: string;
    avatar: string | null;
    equity: number;
    pnl: number;
    returnPct: number;
    trades: number;
    winRate: number;
    stockPnl: number;
    fnoPnl: number;
    badges?: string[];
    country: string | null;
}

export default function LeaderboardPage() {
    const [period, setPeriod] = useState('daily');
    const [type, setType] = useState('combined');
    const [search, setSearch] = useState('');
    const [minTrades, setMinTrades] = useState(0);
    const [sortBy, setSortBy] = useState('return');
    const [friendsOnly, setFriendsOnly] = useState(false);
    const [data, setData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const router = useRouter();

    const fetchLeaderboard = async () => {
        try {
            const url = new URL(window.location.origin + '/api/leaderboard');
            url.searchParams.set('period', period);
            url.searchParams.set('type', type);
            if (search) url.searchParams.set('search', search);
            url.searchParams.set('minTrades', minTrades.toString());
            url.searchParams.set('sortBy', sortBy);
            if (friendsOnly) url.searchParams.set('friends', 'true');

            const res = await fetch(url.toString());
            const json = await res.json();
            if (Array.isArray(json)) {
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCurrentSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setCurrentUserId(session.user.id);
        };
        fetchCurrentSession();
        setLoading(true);
        fetchLeaderboard();

        // Step 8: Live updates
        const interval = setInterval(fetchLeaderboard, 10000); // 10s auto refresh
        return () => clearInterval(interval);
    }, [period, type, search, minTrades, sortBy, friendsOnly]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const totalTraders = data.length;
    const totalVolume = data.reduce((sum, u) => sum + Math.abs(u.pnl), 0);
    const topReturn = data[0]?.returnPct || 0;

    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    const currentUser = data.find(u => u.userId === currentUserId);

    return (
        <div className="p-6 space-y-8 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto pb-24">
            {/* HERO HEADER - V3 */}
            <HeroHeader totalTraders={totalTraders} totalVolume={totalVolume} topReturn={topReturn} />

            {/* Sub-Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#1E232F]/30 p-4 rounded-xl border border-gray-800/50 backdrop-blur-md">

                {/* Period & Asset Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                    {/* Period Chips */}
                    <div className="flex bg-[#1E232F]/80 p-1.5 rounded-lg border border-gray-800 shadow-xl">
                        {['daily', 'weekly', 'monthly', 'alltime'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Divider for Desktop */}
                    <div className="hidden md:block w-px h-8 bg-gray-800"></div>

                    {/* Asset Type Chips */}
                    <div className="flex gap-2 overflow-x-auto">
                        {['combined', 'stocks', 'fno'].map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors whitespace-nowrap ${type === t ? 'bg-[#2B313F] text-white border-gray-500 shadow-md' : 'border-gray-400 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search trader..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/50 border border-gray-300 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between bg-gray-200/50 backdrop-blur-sm p-4 rounded-xl border border-gray-300">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Sort By:</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white text-sm text-gray-900 font-medium border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:border-blue-500 transition-colors shadow-sm">
                            <option value="return">Return %</option>
                            <option value="winRate">Win Rate %</option>
                            <option value="pnl">Total P&L</option>
                            <option value="trades">Number of Trades</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Min Trades: <span className="text-gray-900 w-6 inline-block">{minTrades}</span></label>
                        <input type="range" min="0" max="100" step="5" value={minTrades} onChange={e => setMinTrades(Number(e.target.value))} className="w-24 md:w-32 accent-blue-500" />
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end pt-2 md:pt-0 border-t border-gray-300 md:border-none">
                    <label className="text-sm font-bold text-gray-700">Friends Only</label>
                    <button onClick={() => setFriendsOnly(!friendsOnly)} className={`w-10 h-5 rounded-full relative transition-colors ${friendsOnly ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${friendsOnly ? 'translate-x-5.5' : 'translate-x-[2px]'}`} />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && data.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : data.length === 0 ? (
                <div className="bg-[#1E232F]/50 border border-gray-800 rounded-xl p-12 text-center">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-400">No rankings available</h3>
                    <p className="text-gray-500 text-sm mt-2">Trade more to climb the ladder or adjust your filters.</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Animated Gamified Podium */}
                    {top3.length > 0 && (
                        <TopPodium top3={top3} onProfileClick={(username) => setSelectedUser(username)} />
                    )}

                    {/* Main Leaderboard Table */}
                    <div className="bg-[#1A1F2C] border border-gray-700 rounded-xl overflow-x-auto shadow-2xl relative max-h-[800px]">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-gray-700 bg-[#161B22] shadow-sm text-xs uppercase text-gray-300 font-bold whitespace-nowrap tracking-wider">
                                    <th className="p-4 pl-6 w-16 text-center">Rank</th>
                                    <th className="p-4 w-1/3">Trader</th>
                                    <th className="p-4 text-right">Equity</th>
                                    <th className="p-4 text-right">Total P&L</th>
                                    <th className="p-4 text-right">Return</th>
                                    <th className="p-4 text-right">Win Rate</th>
                                    <th className="p-4 text-right pr-6">Trades</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {rest.map((user, idx) => (
                                    <tr
                                        key={user.userId}
                                        onClick={() => setSelectedUser(user.username)}
                                        className={`hover:bg-blue-900/20 hover:shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] transition-all group cursor-pointer ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                                    >
                                        <td className="p-4 pl-6 text-center font-mono text-gray-500">#{user.rank}</td>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-gray-700/50 group-hover:border-blue-500/50 transition-colors">
                                                {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" /> : <span className="font-bold text-gray-300 text-xs">{user.username.substring(0, 2).toUpperCase()}</span>}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                    {user.username}
                                                    {user.badges && user.badges.map(b => (
                                                        <span key={b} title={b} className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-1.5 py-0.5 rounded-full flex items-center">
                                                            <Medal className="w-3 h-3 mr-1" /> {b}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-gray-300 font-medium">{formatCurrency(user.equity)}</td>
                                        <td className={`p-4 text-right font-medium ${user.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {user.pnl > 0 ? '+' : ''}{formatCurrency(user.pnl)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className={`font-bold ${user.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {user.returnPct > 0 ? '+' : ''}{user.returnPct.toFixed(2)}%
                                                </span>
                                                {user.returnPct >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500/70" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500/70" />}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-medium ${user.winRate >= 50 ? 'text-emerald-400' : (user.winRate > 0 ? 'text-orange-400' : 'text-gray-500')}`}>
                                                {user.winRate > 0 ? user.winRate.toFixed(1) + '%' : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right pr-6 text-gray-400">{user.trades}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* V3 Sticky Rank Overlay */}
            <StickyRank currentUser={currentUser} onViewProfile={(username) => setSelectedUser(username)} />

            {/* Profile Quick-View Modal */}
            <ProfilePreviewModal
                username={selectedUser}
                onClose={() => setSelectedUser(null)}
                onViewFullProfile={(username) => router.push(`/profile/${username}`)}
            />
        </div>
    );
}

