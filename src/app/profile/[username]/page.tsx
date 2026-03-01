import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Trophy, TrendingUp, Briefcase, Star, History, LineChart as ChartIcon, Shield, Medal, Target, MapPin } from 'lucide-react';
import ProfileCharts from './ProfileCharts';
import ProfileHeader from '../components/ProfileHeader';
import KeyStatsCards from '../components/KeyStatsCards';
import dynamic from 'next/dynamic';
import BadgesGrid from '../components/BadgesGrid';
import PublicBioStrategy from '../components/PublicBioStrategy';
import { ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';

const EquityCurveChart = dynamic(() => import('../components/EquityCurveChart'), { loading: () => <div className="h-[400px] w-full bg-[#1E232F]/50 animate-pulse rounded-2xl flex items-center justify-center border border-gray-800"><span className="text-gray-500 font-semibold tracking-widest text-sm uppercase">Loading Chart...</span></div> });
const TradeAnalyticsGrid = dynamic(() => import('../components/TradeAnalyticsGrid'), { loading: () => <div className="h-[300px] w-full bg-[#1E232F]/50 animate-pulse rounded-2xl mt-6 border border-gray-800" /> });
const RecentTradesTable = dynamic(() => import('../components/RecentTradesTable'), { loading: () => <div className="h-[400px] w-full bg-[#1E232F]/50 animate-pulse rounded-2xl mt-6 border border-gray-800" /> });

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const supabase = await createClient();
    const { username } = await params;

    const { data: profile } = await supabase.from('profiles').select('id, username, bio, is_private').eq('username', username).single();
    if (!profile || profile.is_private) {
        return {
            title: 'Profile Not Found | PaperTradingArena',
            description: 'This trader profile is either private or does not exist.'
        };
    }

    const { data: stats } = await supabase.from('leaderboard_stats').select('total_return_pct, trades_count, win_rate').eq('user_id', profile.id).single();

    const returnPct = stats?.total_return_pct ? stats.total_return_pct.toFixed(2) : '0.00';
    const title = `Trader ${profile.username} – ${returnPct}% Return | PaperTradingArena Leaderboard`;
    const description = profile.bio || `Check out ${profile.username}'s trading performance, equity curve, and recent trades.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'profile',
            username: profile.username,
        },
        twitter: {
            card: 'summary',
            title,
            description,
        }
    };
}

export default async function PublicUserProfile({ params }: { params: Promise<{ username: string }> }) {
    const supabase = await createClient();

    // Auth Check
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (!session) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <p className="text-gray-400">Please sign in to view trader profiles.</p>
            </div>
        );
    }

    const { username } = await params;

    // Fetch user profile
    const { data: profile } = await supabase.from('profiles').select('id, username, bio, country, created_at, avatar_url, is_private, hide_trades, hide_equity').eq('username', username).single();

    if (!profile) return notFound();

    const isOwnProfile = currentUser?.id === profile.id;

    // Full Profile Privacy Guard
    if (profile.is_private && !isOwnProfile) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
                <ShieldAlert className="w-16 h-16 text-gray-600 mb-6 mx-auto" strokeWidth={1.5} />
                <h2 className="text-3xl font-black text-white tracking-tight">Private Profile</h2>
                <p className="text-gray-400 mt-3 max-w-sm">This trader has chosen to hide their profile from the public leaderboard.</p>
            </div>
        );
    }

    const userId = profile.id;

    // Fetch stats
    const { data: fetchedStats } = await supabase.from('leaderboard_stats').select('*').eq('user_id', userId).single();

    // Fallback default stats for a fresh profile
    const stats = fetchedStats || { total_equity: 0, invested: 0, total_pnl: 0, fno_pnl: 0, stock_pnl: 0, trades_count: 0, total_return_pct: 0, win_rate: 0 };

    // Fetch badges
    const { data: badges } = await supabase.from('user_badges').select('badge').eq('user_id', userId);

    // Fetch Rank from latest snapshot
    const today = new Date().toISOString().split('T')[0];
    const { data: snapshot } = await supabase.from('leaderboard_snapshots')
        .select('rank')
        .eq('user_id', userId)
        .eq('period', 'daily')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

    const rank = snapshot?.rank || '-';

    // Fetch recent trades for history view and charts
    const { data: recentTrades } = await supabase.from('trades')
        .select('type, symbol, qty, avg_price, created_at, status, realized_pnl')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

    const formatCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

    const { count: followersCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', profile.id);

    const { count: followingCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

    let initialIsFollowing = false;
    if (currentUser && !isOwnProfile) {
        const { data: followCheck } = await supabase
            .from('friends')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('friend_id', profile.id)
            .single();

        initialIsFollowing = !!followCheck;
    }

    let displayStats = { ...stats };
    let displayTrades = recentTrades || [];

    // Apply Privacy Filters if not owner
    if (!isOwnProfile) {
        if (profile.hide_equity) {
            displayStats.invested = 0;
            displayStats.equity = 0;
            displayStats.realizedPnl = 0;
            displayStats.returns = 0;
            // Best trade / worst trade P&L could also be nullified here if we were computing them.
            // But we keep trade counts and win rates.
        }

        if (profile.hide_trades) {
            displayTrades = [];
        }
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        dateCreated: profile.created_at,
        mainEntity: {
            '@type': 'Person',
            name: profile.username,
            identifier: profile.username,
            description: profile.bio || `Trader on PaperTradingArena`,
            additionalProperty: [
                {
                    '@type': 'PropertyValue',
                    name: 'Total Return',
                    value: `${displayStats.returns?.toFixed(2) || 0}%`
                },
                {
                    '@type': 'PropertyValue',
                    name: 'Win Rate',
                    value: `${displayStats.totalTrades ? Math.round(((displayStats.winningTrades || 0) / displayStats.totalTrades) * 100) : 0}%`
                },
                {
                    '@type': 'PropertyValue',
                    name: 'Total Trades',
                    value: displayStats.totalTrades || 0
                }
            ]
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Header Profile Card */}
            <ProfileHeader
                profile={profile}
                rank={rank}
                isOwnProfile={isOwnProfile}
                followersCount={followersCount || 0}
                followingCount={followingCount || 0}
                initialIsFollowing={initialIsFollowing}
                stats={displayStats}
            />

            {/* Core Stats Grid */}
            <KeyStatsCards stats={displayStats} />

            {/* Bio and Badges Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PublicBioStrategy profile={profile} />
                </div>
                <div>
                    <BadgesGrid badges={badges || []} />
                </div>
            </div>

            {/* If hiding trades, optionally hide the visual chart/analytics blocks too or let them render empty states */}
            {(!profile.hide_trades || isOwnProfile) && (
                <div className="grid grid-cols-1 gap-6 mt-8">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Trading Analytics</h2>
                        {profile.hide_equity && !isOwnProfile && <span className="ml-4 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">P&L Hidden</span>}
                    </div>

                    <div className="w-full hidden lg:block">
                        <EquityCurveChart trades={displayTrades} initialEquity={displayStats.invested || displayStats.equity || 100000} />
                    </div>

                    <div className="w-full block lg:hidden pb-4 mb-4 border-b border-gray-800/50">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <span className="text-sm font-semibold text-gray-400">Equity Sparkline</span>
                        </div>
                        <EquityCurveChart trades={displayTrades} initialEquity={displayStats.invested || displayStats.equity || 100000} compact={true} />
                    </div>

                    {/* Deep Analytics Grid */}
                    <TradeAnalyticsGrid trades={displayTrades} />

                    {/* Interactive Trades Table */}
                    <RecentTradesTable trades={displayTrades} />
                </div>
            )}

            {(profile.hide_trades && !isOwnProfile) && (
                <div className="bg-[#1E232F]/50 border border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-8">
                    <History className="w-10 h-10 text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-300">Trade History Hidden</h3>
                    <p className="text-sm text-gray-500 mt-2">The trader has chosen to keep their transaction log private.</p>
                </div>
            )}
        </div>
    );
}
