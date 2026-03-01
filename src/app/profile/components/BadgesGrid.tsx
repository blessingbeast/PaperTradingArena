'use client';

import { motion } from 'framer-motion';
import { Target, Zap, Shield, Crown, Flame, Award, Star } from 'lucide-react';

interface BadgesGridProps {
    badges: { badge: string }[];
}

// Maps known badge strings to specific icons and colors
const BADGE_CONFIG: Record<string, { icon: any, color: string, bg: string, shadow: string, desc: string }> = {
    '100 Trades Club': {
        icon: Target,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
        shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        desc: 'Executed over 100 trades.'
    },
    '50% Return Club': {
        icon: Crown,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        shadow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        desc: 'Achieved 50%+ all-time return.'
    },
    'Options King': {
        icon: Zap,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/30',
        shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
        desc: 'High volume options trader.'
    },
    'Risk Manager': {
        icon: Shield,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        desc: 'Maintained low drawdown.'
    },
    '10 Winning Streak': {
        icon: Flame,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/30',
        shadow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]',
        desc: 'Consecutive winning trades.'
    }
};

const DEFAULT_CONFIG = {
    icon: Award,
    color: 'text-gray-300',
    bg: 'bg-gray-500/10 border-gray-500/30',
    shadow: 'hover:shadow-[0_0_20px_rgba(156,163,175,0.3)]',
    desc: 'Special achievement unlocked.'
};

export default function BadgesGrid({ badges }: BadgesGridProps) {
    if (!badges || badges.length === 0) return null;

    return (
        <div className="bg-[#1E232F]/50 border border-gray-800 rounded-2xl shadow-xl backdrop-blur-md p-6 h-full">
            <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-white tracking-tight">Achievements & Badges</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((b, idx) => {
                    const config = Object.keys(BADGE_CONFIG).find(key => b.badge.includes(key))
                        ? BADGE_CONFIG[Object.keys(BADGE_CONFIG).find(key => b.badge.includes(key))!]
                        : DEFAULT_CONFIG;

                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={b.badge + idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 group cursor-default ${config.bg} ${config.shadow}`}
                        >
                            <div className="relative mb-3">
                                <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full group-hover:opacity-50 transition-opacity" />
                                <Icon className={`w-8 h-8 ${config.color} relative z-10 transition-transform group-hover:scale-110 duration-300`} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-sm font-bold text-gray-200 mb-1">{b.badge}</h4>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {config.desc}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
