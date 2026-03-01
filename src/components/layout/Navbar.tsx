'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect } from 'react';
import { User, LogOut, Settings, LayoutDashboard, WalletCards } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePathname } from 'next/navigation';

export function Navbar() {
    const { user, signOut } = useAuth();
    const { balance } = usePortfolio();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === '/';

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
                    <Link href="/" className="font-bold text-[22px] flex items-center gap-2 tracking-[0.5px] group">
                        {/* Minimal Candlestick Upward Arrow Logo */}
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-300">
                            <rect width="28" height="28" rx="6" fill="url(#paint0_linear)" />
                            <path d="M14 6V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M10 10H18V18H10V10Z" fill="white" />
                            <path d="M14 6L10 10H18L14 6Z" fill="white" />
                            <defs>
                                <linearGradient id="paint0_linear" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#1E40AF" />
                                    <stop offset="1" stopColor="#38BDF8" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] dark:from-white dark:to-white">
                            PaperTradingArena
                        </span>
                    </Link>

                    {/* Minimal decorative links if not logged in */}
                    {!user && (
                        <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 gap-8 text-sm font-semibold tracking-wide">
                            <Link href="/features" className="text-muted-foreground relative hover:text-foreground hover:text-[#2563EB] transition-colors after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-[#2563EB] hover:after:scale-x-100 after:transition-transform after:origin-left">Features</Link>
                            <Link href="/leaderboard" className="text-muted-foreground relative hover:text-foreground hover:text-[#2563EB] transition-colors after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-[#2563EB] hover:after:scale-x-100 after:transition-transform after:origin-left">Leaderboard</Link>
                            <Link href="/pricing" className="text-muted-foreground relative hover:text-foreground hover:text-[#2563EB] transition-colors after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-[#2563EB] hover:after:scale-x-100 after:transition-transform after:origin-left">Pricing</Link>
                            <Link href="/learn" className="text-muted-foreground relative hover:text-foreground hover:text-[#2563EB] transition-colors after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-[#2563EB] hover:after:scale-x-100 after:transition-transform after:origin-left">Learn</Link>
                        </div>
                    )}
                </div>

                {/* Right Side: Status, Balance, Theme, Profile */}
                <div className="flex items-center gap-3">
                    {/* Unauthenticated Home Page State */}
                    {!user && isHomePage && (
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-secondary border border-border mr-1">
                                <WalletCards className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-bold font-mono">₹10,00,000.00</span>
                            </div>
                            <Link href="/signup">
                                <Button size="sm" className="bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0">
                                    Start Trading
                                </Button>
                            </Link>
                        </div>
                    )}

                    {user ? (
                        <>
                            {/* Market Status */}
                            {!isHomePage && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold mr-2 border">
                                    <span className={`h-2 w-2 rounded-full ${isMarketOpen ? 'bg-profit animate-pulse' : 'bg-muted-foreground'}`}></span>
                                    <span className="text-secondary-foreground">{isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}</span>
                                </div>
                            )}

                            {/* Balance Display */}
                            {(isHomePage || balance !== undefined) && (
                                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-md bg-secondary border mr-2">
                                    <WalletCards className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-bold font-mono">
                                        {isHomePage ? "₹10,00,000.00" : `₹${balance?.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                                    </span>
                                </div>
                            )}

                            {/* Home Page Call To Action for Logged In User */}
                            {isHomePage && (
                                <Link href="/dashboard" className="hidden md:block mr-2">
                                    <Button size="sm" className="bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0">Start Trading</Button>
                                </Link>
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
                            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-md bg-secondary border mr-2">
                                <WalletCards className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-bold font-mono text-foreground">
                                    ₹10,00,000.00
                                </span>
                            </div>
                            <ThemeToggle />
                            <Link href="/login" className="hidden md:inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
                                Login
                            </Link>
                            <Link href="/signup">
                                <Button size="sm" className="bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(37,99,235,0.3)]">Start Trading</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
