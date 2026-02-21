'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useMarketData, MarketData } from '@/hooks/useMarketData';
import { Star, Trash2, Loader2, BarChart2, ChevronUp, ChevronDown, Bell } from 'lucide-react';
import Link from 'next/link';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { toast } from 'sonner';

const WATCHLIST_GROUPS = ['Intraday', 'Long Term', 'F&O', 'Watchlist 4', 'Watchlist 5'];

function WatchlistRow({
    symbol,
    stock,
    onRemove
}: {
    symbol: string,
    stock: MarketData,
    onRemove: (s: string) => void
}) {
    const isPositive = stock.change >= 0;
    const isLoaded = stock.price > 0;

    // Price Flash Logic
    const [flashClass, setFlashClass] = useState('');
    const prevPriceRef = useRef(stock.price);

    useEffect(() => {
        if (stock.price !== prevPriceRef.current && prevPriceRef.current !== 0) {
            if (stock.price > prevPriceRef.current) {
                setFlashClass('bg-profit/20 text-profit');
            } else if (stock.price < prevPriceRef.current) {
                setFlashClass('bg-destructive/20 text-destructive');
            }

            const timer = setTimeout(() => {
                setFlashClass('');
            }, 800);

            prevPriceRef.current = stock.price;
            return () => clearTimeout(timer);
        } else if (stock.price > 0) {
            prevPriceRef.current = stock.price;
        }
    }, [stock.price]);

    return (
        <div className="group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 relative">
            {/* 1. Symbol & Sparkline */}
            <div className="flex items-center gap-6 w-[35%] min-w-[200px]">
                <div className="flex flex-col gap-1 w-24">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{stock.symbol}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border w-fit uppercase font-mono font-semibold">NSE</span>
                </div>
                {isLoaded && stock.sparkline ? (
                    <Sparkline
                        data={stock.sparkline}
                        color={isPositive ? "#16a34a" : "#dc2626"}
                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                )}
            </div>

            {/* 2. Day H/L & 52w H/L */}
            <div className="hidden md:flex flex-col gap-1 w-[25%]">
                {isLoaded ? (
                    <>
                        <div className="flex justify-between text-xs text-muted-foreground w-40">
                            <span>Day</span>
                            <span className="font-mono">{stock.low?.toFixed(1)} - {stock.high?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground/70 w-40">
                            <span>52W</span>
                            <span className="font-mono">{stock.fiftyTwoWeekLow?.toFixed(1)} - {stock.fiftyTwoWeekHigh?.toFixed(1)}</span>
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                        <div className="h-2 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                )}
            </div>

            {/* 3. Volume */}
            <div className="hidden lg:flex flex-col w-[15%] text-right pr-4">
                {isLoaded ? (
                    <span className="text-xs font-mono text-muted-foreground truncate" title={(stock.volume || 0).toLocaleString()}>
                        {(stock.volume || 0).toLocaleString()}
                    </span>
                ) : (
                    <div className="h-3 w-16 bg-muted animate-pulse rounded ml-auto"></div>
                )}
            </div>

            {/* 4. Price & Quick Actions */}
            <div className="flex items-center justify-end w-[25%] relative">

                {/* Price Display */}
                <div className={cn("flex flex-col items-end gap-0.5 group-hover:opacity-0 transition-opacity", flashClass ? "" : "opacity-100")}>
                    {isLoaded ? (
                        <>
                            <span className={cn(
                                "text-sm font-mono font-bold px-2 py-0.5 rounded transition-colors duration-300",
                                flashClass || (isPositive ? "text-profit" : "text-destructive")
                            )}>
                                {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-1">
                                {isPositive ? <ChevronUp className="w-3 h-3 text-profit" /> : <ChevronDown className="w-3 h-3 text-destructive" />}
                                <span className="text-xs font-mono text-muted-foreground">
                                    {stock.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                            <div className="h-3 w-10 bg-muted animate-pulse rounded"></div>
                        </div>
                    )}
                </div>

                {/* Hover Actions */}
                <div className="absolute right-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto bg-background/50 pl-2 backdrop-blur-sm">
                    <Link href={`/dashboard/trade?symbol=${stock.symbol}&action=buy`}>
                        <button className="h-8 px-3 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">
                            B
                        </button>
                    </Link>
                    <Link href={`/dashboard/trade?symbol=${stock.symbol}&action=sell`}>
                        <button className="h-8 px-3 rounded text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm">
                            S
                        </button>
                    </Link>
                    <button onClick={() => { toast.info('Alerts coming soon!') }} className="h-8 w-8 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-sm hidden sm:flex">
                        <Bell className="w-4 h-4" />
                    </button>
                    <Link href={`/dashboard/trade?symbol=${stock.symbol}`}>
                        <button className="h-8 w-8 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-sm hidden md:flex">
                            <BarChart2 className="w-4 h-4" />
                        </button>
                    </Link>
                    <button
                        onClick={() => onRemove(stock.symbol)}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border bg-muted hover:bg-destructive hover:text-destructive-foreground hover:border-destructive text-muted-foreground transition-colors shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
}

export default function WatchlistPage() {
    const [activeTab, setActiveTab] = useState(WATCHLIST_GROUPS[0]);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Polling every 5 seconds for Real-time Feel!
    const { data: marketData } = useMarketData(symbols, 5000);

    const fetchWatchlist = async (listName: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/watchlist?list_name=${encodeURIComponent(listName)}`);
            const data = await res.json();
            if (Array.isArray(data)) setSymbols(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist(activeTab);
    }, [activeTab]);

    const removeFromWatchlist = async (symbol: string) => {
        try {
            const res = await fetch('/api/watchlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, list_name: activeTab })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to remove');
            }
            setSymbols(prev => prev.filter(s => s !== symbol));
            toast.success(`${symbol} removed from ${activeTab}`);
        } catch (e) {
            console.error(e);
        }
    };

    const addToWatchlist = async (symbol: string) => {
        if (symbols.includes(symbol)) {
            toast.info(`${symbol} is already in ${activeTab}`);
            return;
        }
        try {
            const res = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, list_name: activeTab })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add symbol');
            }
            setSymbols(prev => [...prev, symbol]);
            toast.success(`${symbol} added to ${activeTab}`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to add symbol');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
                    <p className="text-muted-foreground text-sm">Real-time quotes and quick trading</p>
                </div>
            </div>

            <Card className="border shadow-sm bg-card p-1">
                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-border/50">
                    {WATCHLIST_GROUPS.map((group) => (
                        <button
                            key={group}
                            onClick={() => setActiveTab(group)}
                            className={cn(
                                "px-6 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
                                activeTab === group
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            {group}
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-muted/10 border-b">
                    <div className="w-full max-w-md">
                        <StockSearch onSelect={addToWatchlist} placeholder={`Search and add to ${activeTab}...`} />
                    </div>
                </div>

                <div className="flex items-center px-4 py-2 bg-muted/40 border-b">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-[35%] min-w-[200px]">Symbol</span>
                    <span className="hidden md:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-[25%]">Range</span>
                    <span className="hidden lg:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-[15%] text-right pr-4">Vol</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-[25%] text-right">Price</span>
                </div>

                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-4" />
                        <p className="text-muted-foreground text-sm">Loading {activeTab}...</p>
                    </div>
                ) : symbols.length === 0 ? (
                    <div className="py-24 text-center">
                        <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-sm font-medium text-foreground">Nothing to watch</h3>
                        <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                            Use the search bar above to add stocks to {activeTab}.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {symbols.map((symbol) => {
                            const stock = marketData.find(s => s.symbol === symbol) || {
                                symbol, price: 0, change: 0, changePercent: 0, name: 'Loading...'
                            };

                            return (
                                <WatchlistRow
                                    key={`${activeTab}-${symbol}`}
                                    symbol={symbol}
                                    stock={stock}
                                    onRemove={removeFromWatchlist}
                                />
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
