'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, Share2, Edit2, Check, X, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface ProfileHeaderProps {
    profile: {
        id: string;
        username: string;
        avatar_url: string | null;
        country: string | null;
        bio: string | null;
        created_at: string;
    };
    rank: string | number;
    isOwnProfile: boolean;
    followersCount: number;
    followingCount: number;
    initialIsFollowing: boolean;
    stats?: any;
}

export default function ProfileHeader({
    profile,
    rank,
    isOwnProfile,
    followersCount,
    followingCount,
    initialIsFollowing,
    stats
}: ProfileHeaderProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(profile.bio || '');
    const [isSavingBio, setIsSavingBio] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [copied, setCopied] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const shareCardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleShare = async () => {
        if (!shareCardRef.current || isCapturing) return;
        setIsCapturing(true);
        try {
            const dataUrl = await toPng(shareCardRef.current, {
                cacheBust: true,
                backgroundColor: '#0F172A',
                style: { margin: '0' },
                pixelRatio: 2
            });

            const link = document.createElement('a');
            link.download = `${profile.username}-stats.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSaveBio = async () => {
        setIsSavingBio(true);
        try {
            await supabase.from('profiles').update({ bio: bioText }).eq('id', profile.id);
            setIsEditingBio(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingBio(false);
        }
    };

    const handleFollowToggle = async () => {
        // Optimistic UI update
        setIsFollowing(!isFollowing);

        try {
            const res = await fetch(`/api/profile/${profile.username}/follow`, {
                method: 'POST',
            });

            if (!res.ok) {
                // Revert on failure
                setIsFollowing(isFollowing);
                console.error("Failed to toggle follow status");
            }
        } catch (err) {
            setIsFollowing(isFollowing);
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl p-[1px] overflow-hidden group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Animated Glow Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 animate-gradient-x opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Main Card Content */}
            <div className="relative bg-[#111827]/90 backdrop-blur-xl rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-2xl border border-white/5 z-10">

                {/* Avatar Section */}
                <div className="relative shrink-0">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-br from-blue-600 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <div className="w-full h-full rounded-full bg-[#1E232F] overflow-hidden border-2 border-transparent flex items-center justify-center text-4xl font-bold text-gray-200 relative group/avatar">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.username} />
                            ) : (
                                profile.username.substring(0, 2).toUpperCase()
                            )}

                            {/* Avatar Overlay for own profile */}
                            {isOwnProfile && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/dashboard/settings'}>
                                    <Edit2 className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Rank Badge Floating */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[0_5px_15px_rgba(245,158,11,0.4)] border border-white/20">
                        Rank #{rank}
                    </div>
                </div>

                {/* Identity & Bio Details */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left pt-2">
                    <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-2">
                            {profile.username}
                            {typeof rank === 'number' && rank <= 10 && (
                                <span title="Top 10 Trader"><ShieldCheck className="w-6 h-6 text-blue-400" /></span>
                            )}
                        </h1>
                        <span className="hidden md:flex px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
                            PRO TRADER
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-gray-400 mb-6">
                        {profile.country && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {profile.country}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Joined {joinDate}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-300 font-bold">{followersCount}</span> Followers • <span className="text-gray-300 font-bold">{followingCount}</span> Following
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="w-full max-w-2xl relative group/bio min-h-[60px]">
                        <AnimatePresence mode="wait">
                            {isEditingBio ? (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col gap-2"
                                >
                                    <textarea
                                        value={bioText}
                                        onChange={(e) => setBioText(e.target.value)}
                                        className="w-full bg-[#1E232F] border border-blue-500/50 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                        rows={3}
                                        placeholder="Write your trading strategy or bio here..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsEditingBio(false)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                        <button onClick={handleSaveBio} disabled={isSavingBio} className="p-1.5 text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50"><Check className="w-4 h-4" /></button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative"
                                >
                                    <p className="text-gray-300 text-base leading-relaxed italic border-l-2 border-blue-500/50 pl-4 py-1">
                                        "{bioText || 'No bio provided yet.'}"
                                    </p>

                                    {isOwnProfile && (
                                        <button
                                            onClick={() => setIsEditingBio(true)}
                                            className="absolute -right-2 top-0 p-1.5 text-gray-500 hover:text-blue-400 opacity-0 group-hover/bio:opacity-100 transition-opacity bg-[#1E232F] rounded-md border border-gray-700 shadow-lg"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                    {!isOwnProfile && (
                        <div className="flex gap-2 w-full md:w-48">
                            <Button
                                onClick={handleFollowToggle}
                                className={`flex-1 h-10 font-bold tracking-wide shadow-lg transition-all ${isFollowing ? 'bg-[#1E232F] hover:bg-red-500/20 text-white border border-gray-700 hover:border-red-500 hover:text-red-400' : 'bg-white hover:bg-gray-100 text-[#0F172A]'}`}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const lockKey = `reported_${profile.id}`;
                                    if (localStorage.getItem(lockKey)) return toast.error("You have already reported this profile.");
                                    localStorage.setItem(lockKey, 'true');
                                    toast.success("Profile reported for manual review. Thank you.");
                                }}
                                className="h-10 w-10 p-0 shrink-0 bg-[#1E232F] hover:bg-red-500/20 text-gray-500 hover:border-red-500 hover:text-red-400 border-gray-700 transition-all flex items-center justify-center"
                                title="Report Fake Stats / Abuse"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            </Button>
                        </div>
                    )}

                    <Button
                        onClick={handleShare}
                        variant="outline"
                        disabled={isCapturing}
                        className="w-full md:w-48 h-10 bg-[#1E232F] hover:bg-[#2B313F] text-gray-300 border-gray-700 font-medium flex items-center justify-center gap-2 transition-all"
                    >
                        {isCapturing ? <Check className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4" />}
                        {isCapturing ? 'Generating...' : 'Share Stats Card'}
                    </Button>
                </div>
            </div>

            {/* Hidden Share Card Template (Rendered off-screen) */}
            <div className="absolute top-[-9999px] left-[-9999px]">
                <div ref={shareCardRef} className="w-[600px] h-auto bg-[#0F172A] p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 mb-4 z-10 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                            alt={profile.username}
                            className="w-full h-full rounded-full object-cover border-2 border-[#161B22]"
                            crossOrigin="anonymous"
                        />
                    </div>

                    <h1 className="text-4xl font-black text-white tracking-tight z-10">{profile.username}</h1>
                    <div className="flex items-center gap-2 mt-3 z-10 bg-gray-800/50 px-4 py-1.5 rounded-full border border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20" />
                        <span className="text-amber-400 font-black tracking-widest text-sm relative z-10">{typeof rank === 'number' ? `RANK #${rank}` : rank?.toString().toUpperCase() || 'ROOKIE'}</span>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-2 gap-4 w-full mt-8 z-10">
                            <div className="bg-[#1E232F] p-4 rounded-2xl border border-gray-800 border-l-4 border-l-blue-500 shadow-lg">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Return</p>
                                <p className={`text-4xl font-black ${(stats.returns || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(stats.returns || 0) > 0 ? '+' : ''}{(stats.returns || 0).toFixed(2)}%
                                </p>
                            </div>
                            <div className="bg-[#1E232F] p-4 rounded-2xl border border-gray-800 border-l-4 border-l-purple-500 shadow-lg">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Win Rate</p>
                                <p className="text-4xl font-black text-white">
                                    {stats.totalTrades ? Math.round(((stats.winningTrades || 0) / stats.totalTrades) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 text-gray-500 text-sm font-semibold z-10 flex items-center justify-between w-full border-t border-gray-800/50 pt-4">
                        <span className="flex items-center gap-1.5 opacity-80 text-blue-400"><ShieldCheck className="w-4 h-4" /> PaperTradingArena.com</span>
                        <span className="opacity-80">@{profile.username}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
