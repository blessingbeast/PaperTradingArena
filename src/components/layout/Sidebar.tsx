
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    TrendingUp,
    Briefcase,
    History,
    Settings,
    LogOut,
    Star,
    Layers,
    Trophy,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

const sidebarItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/trade', label: 'Trade', icon: TrendingUp },
    { href: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/dashboard/positions', label: 'Positions', icon: Layers },
    { href: '/dashboard/orders', label: 'Orders', icon: History },
    { href: '/dashboard/watchlist', label: 'Watchlist', icon: Star },
    { href: '/dashboard/journal', label: 'Journal', icon: BookOpen },
];

const bottomItems = [
    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <aside className="w-64 border-r bg-background hidden md:flex flex-col h-screen sticky top-0 transition-all select-none">
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b">
                <Link href="/" className="font-bold text-[19px] flex items-center gap-2 tracking-[0.5px] group">
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-300">
                        <rect width="28" height="28" rx="6" fill="url(#paint0_linear_side)" />
                        <path d="M14 6V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M10 10H18V18H10V10Z" fill="white" />
                        <path d="M14 6L10 10H18L14 6Z" fill="white" />
                        <defs>
                            <linearGradient id="paint0_linear_side" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#1E40AF" />
                                <stop offset="1" stopColor="#38BDF8" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] dark:from-white dark:to-white">
                        PaperTradingArena
                    </span>
                </Link>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto hide-scrollbar">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-4 first:mt-0">Trading</div>
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-8">Extras</div>
                {bottomItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
