'use client';

import { useState, useEffect } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export function MiniWatchlist() {
    const searchParams = useSearchParams();
    const currentSymbol = searchParams.get('symbol');

    const [symbols, setSymbols] = useState<string[]>([]);
    const { data: marketData } = useMarketData(symbols);

    const fetchWatchlist = async () => {
        try {
            const res = await fetch('/api/watchlist');
            const data = await res.json();
            if (Array.isArray(data)) setSymbols(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const addToWatchlist = async (symbol: string) => {
        if (symbols.includes(symbol)) return;
        try {
            await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
            });
            setSymbols(prev => [...prev, symbol]);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Search Header */}
            <div className="p-3 border-b border-border">
                <StockSearch onSelect={addToWatchlist} placeholder="Search eg: INFY BSE" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                <div className="divide-y divide-border">
                    {symbols.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Nothing here. Use search to add.
                        </div>
                    ) : (
                        symbols.map((symbol) => {
                            const stock = marketData.find(s => s.symbol === symbol) || {
                                symbol, price: 0, change: 0, changePercent: 0, name: 'Loading...'
                            };

                            const isPositive = stock.change >= 0;
                            const isLoaded = stock.price > 0;
                            const isActive = currentSymbol === symbol;

                            return (
                                <Link
                                    href={`/dashboard/trade?symbol=${symbol}`}
                                    key={symbol}
                                >
                                    <div className={cn(
                                        "group flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer border-l-2",
                                        isActive ? "bg-accent border-primary" : "hover:bg-muted/50 border-transparent"
                                    )}>
                                        {/* Left Side: Symbol */}
                                        <div className="flex flex-col">
                                            <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>
                                                {stock.symbol}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase mt-0.5">NSE</span>
                                        </div>

                                        {/* Right Side: Price */}
                                        <div className="flex flex-col items-end">
                                            {isLoaded ? (
                                                <>
                                                    <span className={cn(
                                                        "text-xs font-mono font-medium",
                                                        isPositive ? "text-profit" : "text-destructive"
                                                    )}>
                                                        {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="flex items-center gap-0.5 mt-0.5">
                                                        {isPositive ?
                                                            <ChevronUp className="w-3 h-3 text-profit" /> :
                                                            <ChevronDown className="w-3 h-3 text-destructive" />
                                                        }
                                                        <span className="text-[10px] font-mono text-muted-foreground">
                                                            {stock.changePercent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                                                    <div className="h-2 w-8 bg-muted animate-pulse rounded"></div>
                                                </div>
                                            )}

                                            {/* Delete Button (visible on hover) */}
                                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        fetch('/api/watchlist', {
                                                            method: 'DELETE',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ symbol })
                                                        });
                                                        setSymbols(prev => prev.filter(s => s !== symbol));
                                                    }}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
