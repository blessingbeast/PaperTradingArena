
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
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <aside className="w-64 border-r bg-background hidden md:flex flex-col h-screen sticky top-0 transition-all select-none">
            <div className="h-16 flex items-center px-6 border-b">
                <Link href="/" className="font-bold text-xl flex items-center gap-2 tracking-tight">
                    <span className="text-primary">TradeSim</span>
                    <span className="text-foreground">India</span>
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
