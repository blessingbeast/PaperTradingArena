'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect } from 'react';
import { User, LogOut, Settings, LayoutDashboard, WalletCards } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePortfolio } from '@/hooks/usePortfolio';

export function Navbar() {
    const { user, signOut } = useAuth();
    const { balance } = usePortfolio();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    // Calculate market status dynamically
    useEffect(() => {
        const checkMarketStatus = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (3600000 * 5.5));
            const day = ist.getDay();
            const hours = ist.getHours();
            const mins = ist.getMinutes();
            const timeInMins = hours * 60 + mins;

            // Monday = 1, Friday = 5. Open: 9:15 = 555, Close: 15:30 = 930
            const open = day >= 1 && day <= 5 && timeInMins >= 555 && timeInMins < 930;
            setIsMarketOpen(open);
        };

        checkMarketStatus();
        const interval = setInterval(checkMarketStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0 transition-colors">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Left Side: Logo (Mobile Only) & Search Mock */}
                <div className="flex items-center gap-4 flex-1">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2 md:hidden tracking-tight">
                        <span className="text-primary">TradeSim</span>
                    </Link>

                    {/* Minimal decorative links if not logged in */}
                    {!user && (
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                            <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">Learn</Link>
                            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
                        </div>
                    )}
                </div>

                {/* Right Side: Status, Balance, Theme, Profile */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {/* Market Status */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold mr-2 border">
                                <span className={`h-2 w-2 rounded-full ${isMarketOpen ? 'bg-profit animate-pulse' : 'bg-muted-foreground'}`}></span>
                                <span className="text-secondary-foreground">{isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}</span>
                            </div>

                            {/* Balance Display */}
                            {balance !== undefined && (
                                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-md bg-secondary border">
                                    <WalletCards className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-bold font-mono">
                                        ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 focus:outline-none ml-1"
                                >
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
                                        {user.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                    </div>
                                </button>

                                {menuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-md z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-4 py-3 border-b flex flex-col gap-1">
                                                <span className="text-sm font-medium text-foreground truncate">{user.email}</span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    Bal: ₹{balance?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-accent-foreground"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                                </Link>
                                                <Link
                                                    href="/dashboard/settings"
                                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-accent-foreground"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    <Settings className="w-4 h-4" /> Settings
                                                </Link>
                                            </div>
                                            <div className="border-t py-1">
                                                <button
                                                    onClick={() => {
                                                        signOut();
                                                        setMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 text-left"
                                                >
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <ThemeToggle />
                            <Link href="/login">
                                <Button variant="outline" size="sm" className="hidden sm:inline-flex">Log In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
