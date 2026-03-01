'use client';

import {
    User, Lock, Sliders, Bell, Shield, Palette,
    CreditCard, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'trading', label: 'Trading Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: CreditCard },
];

export function SettingsSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left group ${isActive
                            ? 'text-blue-700 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTabBackground"
                                className="absolute inset-0 bg-blue-50 dark:bg-[#2563EB]/10 border border-blue-200 dark:border-[#2563EB]/20 rounded-xl"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-600 dark:text-[#38BDF8]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// Mobile variant - horizontal scroll snap tabs
export function SettingsMobileTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
    return (
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-2 pb-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`snap-center shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm font-semibold border ${isActive
                            ? 'bg-blue-50 dark:bg-[#2563EB]/10 text-blue-700 dark:text-white border-blue-200 dark:border-[#2563EB]/30'
                            : 'bg-white dark:bg-[#1E232F]/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2B313F]'
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-[#38BDF8]' : 'text-gray-400 dark:text-gray-500'}`} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
