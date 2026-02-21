'use client';

import { useMarketData } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketTicker() {
    // We fetch a few major indices for the ticker
    const { data: niftyData } = useMarketData('^NSEI'); // NIFTY 50
    const { data: sensexData } = useMarketData('^BSESN'); // SENSEX
    const { data: bankNiftyData } = useMarketData('^NSEBANK'); // BANK NIFTY

    const indices = [
        { name: 'NIFTY 50', data: niftyData?.[0] },
        { name: 'SENSEX', data: sensexData?.[0] },
        { name: 'BANK NIFTY', data: bankNiftyData?.[0] },
        // Repeat for smooth scrolling if needed, but flex gap is fine for now
    ];

    return (
        <div className="w-full bg-card border-b text-[11px] font-mono overflow-hidden flex h-8 items-center shrink-0">
            <div className="flex animate-marquee whitespace-nowrap gap-12 px-4 min-w-full">
                {indices.map((idx, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground uppercase">{idx.name}</span>
                        {idx.data ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {idx.data.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                                <span className={cn(
                                    "flex items-center gap-0.5",
                                    idx.data.change >= 0 ? "text-profit" : "text-destructive"
                                )}>
                                    {idx.data.change > 0 ? '+' : ''}{idx.data.change?.toFixed(2)}
                                    ({idx.data.changePercent?.toFixed(2)}%)
                                    {idx.data.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground/50 animate-pulse">Loading...</span>
                        )}
                    </div>
                ))}

                {/* Duplicate for infinite loop visual effect */}
                {indices.map((idx, i) => (
                    <div key={`dup-${i}`} className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground uppercase">{idx.name}</span>
                        {idx.data ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {idx.data.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                                <span className={cn(
                                    "flex items-center gap-0.5",
                                    idx.data.change >= 0 ? "text-profit" : "text-destructive"
                                )}>
                                    {idx.data.change > 0 ? '+' : ''}{idx.data.change?.toFixed(2)}
                                    ({idx.data.changePercent?.toFixed(2)}%)
                                    {idx.data.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground/50 animate-pulse">Loading...</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
