'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { ChevronUp, ChevronDown, Trash2, Bell, Star, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import stocksData from '@/data/stocks.json';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";

type WatchlistGroup = {
    id: string;
    name: string;
    symbols: string[];
};

type SortOption = 'default' | 'alpha_asc' | 'alpha_desc' | 'change_asc' | 'change_desc' | 'vol_desc';

export function MiniWatchlist() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentSymbol = searchParams.get('symbol');

    const [groups, setGroups] = useState<WatchlistGroup[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>('default');

    // Derived state for the active group's symbols
    const activeGroup = groups.find(g => g.id === activeGroupId);
    const symbols = activeGroup?.symbols || [];

    const { data: marketData } = useMarketData(symbols);

    const fetchWatchlist = async () => {
        try {
            const isDemo = searchParams.get('demo') === 'true';
            if (isDemo) {
                setGroups([
                    { id: 'demo-1', name: '1', symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'SBIN'] },
                    { id: 'demo-2', name: '2', symbols: ['WIPRO', 'HCLTECH', 'TECHM'] },
                    { id: 'demo-3', name: '3', symbols: [] },
                    { id: 'demo-4', name: '4', symbols: [] },
                    { id: 'demo-5', name: '5', symbols: [] },
                ]);
                setActiveGroupId('demo-1');
                return;
            }

            const res = await fetch('/api/watchlist');
            const data = await res.json();
            if (Array.isArray(data)) {
                setGroups(data);
                if (data.length > 0 && !activeGroupId) {
                    setActiveGroupId(data[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch watchlists', e);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const addToWatchlist = async (symbol: string) => {
        if (!activeGroupId) return;
        if (symbols.includes(symbol)) return;

        try {
            const isDemo = searchParams.get('demo') === 'true';
            if (!isDemo) {
                await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_symbol', symbol, group_id: activeGroupId })
                });
            }
            // Optimistic update
            setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, symbols: [...g.symbols, symbol] } : g));
        } catch (e) {
            console.error(e);
        }
    };

    const removeFromWatchlist = async (symbol: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!activeGroupId) return;

        try {
            const isDemo = searchParams.get('demo') === 'true';
            if (!isDemo) {
                await fetch('/api/watchlist', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'remove_symbol', symbol, group_id: activeGroupId })
                });
            }
            // Optimistic update
            setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, symbols: g.symbols.filter(s => s !== symbol) } : g));
        } catch (e) {
            console.error(e);
        }
    };

    // Sorting Logic
    const sortedSymbols = useMemo(() => {
        const uniqueSymbols = Array.from(new Set(symbols));
        if (sortOption === 'default') return uniqueSymbols;

        return [...uniqueSymbols].sort((a, b) => {
            if (sortOption === 'alpha_asc') return a.localeCompare(b);
            if (sortOption === 'alpha_desc') return b.localeCompare(a);

            const dataA = marketData.find(m => m.symbol === a);
            const dataB = marketData.find(m => m.symbol === b);
            if (!dataA || !dataB) return 0;

            if (sortOption === 'change_asc') return dataA.changePercent - dataB.changePercent;
            if (sortOption === 'change_desc') return dataB.changePercent - dataA.changePercent;
            if (sortOption === 'vol_desc') return (dataB.volume || 0) - (dataA.volume || 0);

            return 0;
        });
    }, [symbols, marketData, sortOption]);

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Search Header */}
            <div className="flex flex-col border-b border-border">
                {/* Search Input */}
                <div className="p-2 sm:p-3 border-b border-border">
                    <StockSearch onSelect={addToWatchlist} placeholder="Search eg: infbse, nifty fut" />
                </div>

                {/* Groups / Tabs */}
                <div className="flex items-center px-2 py-1.5 overflow-x-auto hide-scrollbar">
                    <div className="flex w-full">
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setActiveGroupId(group.id)}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors rounded-sm relative",
                                    activeGroupId === group.id
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {group.name}
                                {activeGroupId === group.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary -mb-1.5" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sorting Info */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {sortedSymbols.length} / 50 ITEMS
                </span>
                <div className="relative group/sort">
                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <ArrowUpDown className="w-3 h-3" />
                        Sort
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/sort:block bg-card border border-border rounded-md shadow-lg z-50 w-36 overflow-hidden">
                        <button onClick={() => setSortOption('default')} className={cn("block w-full text-left px-3 py-2 text-[11px] hover:bg-muted", sortOption === 'default' && "bg-muted/50 font-bold")}>Default</button>
                        <button onClick={() => setSortOption('alpha_asc')} className={cn("block w-full text-left px-3 py-2 text-[11px] hover:bg-muted", sortOption === 'alpha_asc' && "bg-muted/50 font-bold")}>Alphabetical (A-Z)</button>
                        <button onClick={() => setSortOption('change_desc')} className={cn("block w-full text-left px-3 py-2 text-[11px] hover:bg-muted", sortOption === 'change_desc' && "bg-muted/50 font-bold")}>% Change (High-Low)</button>
                        <button onClick={() => setSortOption('change_asc')} className={cn("block w-full text-left px-3 py-2 text-[11px] hover:bg-muted", sortOption === 'change_asc' && "bg-muted/50 font-bold")}>% Change (Low-High)</button>
                        <button onClick={() => setSortOption('vol_desc')} className={cn("block w-full text-left px-3 py-2 text-[11px] hover:bg-muted", sortOption === 'vol_desc' && "bg-muted/50 font-bold")}>Volume</button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                <div className="divide-y divide-border">
                    {sortedSymbols.length === 0 ? (
                        <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                <Star className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Empty Watchlist</span>
                            <span className="text-xs text-muted-foreground">Search for stocks above to add them to {activeGroup?.name || 'this list'}.</span>
                        </div>
                    ) : (
                        sortedSymbols.map((symbol) => {
                            const stock = marketData.find(s => s.symbol === symbol) || {
                                symbol, price: 0, change: 0, changePercent: 0, name: 'Loading...', volume: 0
                            };

                            // Find company name from static JSON
                            const companyObj = stocksData.find(s => s.symbol === symbol);
                            const companyName = companyObj ? companyObj.name : stock.name;

                            const isPositive = stock.change >= 0;
                            const isLoaded = stock.price > 0;
                            const isActive = currentSymbol === symbol;

                            return (
                                <ContextMenu key={symbol}>
                                    <ContextMenuTrigger asChild>
                                        <div
                                            onClick={() => router.push(`/dashboard/trade?symbol=${symbol}`)}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer border-l-2",
                                                isActive ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] relative z-10" : "hover:bg-muted/50 border-transparent"
                                            )}
                                        >
                                            {/* Left Side: Symbol & Info */}
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                {/* Company Logo Circle */}
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-extrabold text-foreground shrink-0 border border-border shadow-sm">
                                                    {stock.symbol.substring(0, 1)}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn("text-xs font-bold tracking-tight", isActive ? "text-primary" : "text-foreground")}>
                                                            {stock.symbol}
                                                        </span>
                                                        <span className="text-[9px] bg-muted/80 text-muted-foreground px-1 py-0.5 rounded uppercase font-medium">NSE</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground truncate mt-0.5" title={companyName}>
                                                        {companyName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Middle: Sparkline (hidden on hover) */}
                                            {isLoaded && (
                                                <div className="hidden sm:flex flex-1 max-w-[50px] h-[20px] items-center justify-center px-1 opacity-100 group-hover:opacity-0 transition-opacity">
                                                    <svg width="100%" height="100%" viewBox="0 0 40 20" preserveAspectRatio="none">
                                                        <polyline
                                                            fill="none"
                                                            stroke={isPositive ? "#16a34a" : "#dc2626"}
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            points={
                                                                (stock.sparkline ||
                                                                    // Generate deterministic fake sparkline if not provided
                                                                    Array.from({ length: 10 }, (_, i) => stock.price * (1 + Math.sin(stock.symbol.charCodeAt(0) + i) * 0.02 * (isPositive ? 1 : -1)))
                                                                ).map((val, i, arr) => {
                                                                    const min = Math.min(...arr);
                                                                    const max = Math.max(...arr) || 1;
                                                                    const range = max - min;
                                                                    const x = (i / (arr.length - 1)) * 40;
                                                                    const y = range === 0 ? 10 : 20 - ((val - min) / range) * 20;
                                                                    return `${x},${y}`;
                                                                }).join(' ')
                                                            }
                                                        />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* Right Side: Price or Actions */}
                                            <div className="flex flex-col items-end justify-center min-w-[70px]">
                                                {/* Default View (Price) */}
                                                <div className="flex flex-col items-end group-hover:hidden">
                                                    {isLoaded ? (
                                                        <>
                                                            <span className={cn(
                                                                "text-xs font-mono font-medium tracking-tight",
                                                                isPositive ? "text-profit" : "text-destructive"
                                                            )}>
                                                                {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                                {isPositive ?
                                                                    <ChevronUp className="w-3 h-3 text-profit" /> :
                                                                    <ChevronDown className="w-3 h-3 text-destructive" />
                                                                }
                                                                <span className={cn("text-[10px] font-mono", isPositive ? "text-profit/80" : "text-destructive/80")}>
                                                                    {Math.abs(stock.changePercent).toFixed(2)}%
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <div className="h-3 w-14 bg-muted animate-pulse rounded"></div>
                                                            <div className="h-2 w-10 bg-muted animate-pulse rounded"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="hidden group-hover:flex items-center justify-end gap-1 h-full w-full bg-inherit">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/trade?symbol=${symbol}&action=buy`); }}
                                                        className="flex items-center justify-center w-[26px] h-[26px] rounded bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs transition-colors ring-1 ring-blue-600/20"
                                                        title="Buy"
                                                    >B</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/trade?symbol=${symbol}&action=sell`); }}
                                                        className="flex items-center justify-center w-[26px] h-[26px] rounded bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white font-bold text-xs transition-colors ring-1 ring-red-600/20"
                                                        title="Sell"
                                                    >S</button>

                                                    <div className="relative group/more ml-0.5">
                                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex items-center justify-center w-[26px] h-[26px] rounded hover:bg-muted text-muted-foreground transition-colors border border-border/50">
                                                            <MoreHorizontal className="w-3 h-3" />
                                                        </button>

                                                        {/* More Menu Dropdown */}
                                                        <div className="absolute right-0 top-full mt-1 hidden group-hover/more:block bg-card border border-border rounded-md shadow-lg z-50 w-32 overflow-hidden py-1">
                                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-muted text-muted-foreground flex justify-between items-center">
                                                                Add Alert <Bell className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={(e) => removeFromWatchlist(symbol, e)} className="w-full text-left px-3 py-2 text-[11px] text-destructive hover:bg-destructive/10 flex justify-between items-center">
                                                                Delete <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>

                                    <ContextMenuContent className="w-48">
                                        <ContextMenuItem onClick={() => router.push(`/dashboard/trade?symbol=${symbol}&action=buy`)} className="text-profit focus:text-profit focus:bg-profit/10 cursor-pointer">
                                            Buy {stock.symbol}
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => router.push(`/dashboard/trade?symbol=${symbol}&action=sell`)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                            Sell {stock.symbol}
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem onClick={() => router.push(`/dashboard/trade?symbol=${symbol}`)} className="cursor-pointer">
                                            Open Chart
                                        </ContextMenuItem>
                                        <ContextMenuItem className="cursor-pointer flex justify-between items-center">
                                            Create Alert <Bell className="w-3 h-3 ml-2" />
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem onClick={(e: React.MouseEvent) => removeFromWatchlist(symbol, e)} className="text-destructive focus:text-destructive cursor-pointer flex justify-between items-center">
                                            Remove <Trash2 className="w-3 h-3 ml-2" />
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            );
                        })
                    )}
                </div>
            </div>
        </div >
    );
}
