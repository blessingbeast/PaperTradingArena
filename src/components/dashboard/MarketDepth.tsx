"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface MarketDepthRow {
    action: string;
    qty: number;
    price: number;
    orders?: number;
}

export function MarketDepth({ symbol, currentPrice = 0 }: { symbol: string, currentPrice?: number }) {
    // Generate pseudo-random realistic depth based on current price, memoized so it only changes when price changes
    const { bids, asks, totalBidQty, totalAskQty, volume, oi } = useMemo(() => {
        // Fallback if price is 0
        const basePrice = currentPrice > 0 ? currentPrice : Math.random() * 1000 + 100;

        const bidSpread = basePrice * 0.0005; // 0.05%
        const askSpread = basePrice * 0.0005;

        const bids: MarketDepthRow[] = Array.from({ length: 5 }).map((_, i) => ({
            action: 'BID',
            orders: Math.floor(Math.random() * 15) + 1,
            qty: Math.floor(Math.random() * 5000) + 100,
            price: Number((basePrice - (bidSpread * (i + 1))).toFixed(2))
        }));

        const asks: MarketDepthRow[] = Array.from({ length: 5 }).map((_, i) => ({
            action: 'ASK',
            orders: Math.floor(Math.random() * 15) + 1,
            qty: Math.floor(Math.random() * 5000) + 100,
            price: Number((basePrice + (askSpread * (i + 1))).toFixed(2))
        }));

        const totalBidQty = bids.reduce((acc, b) => acc + b.qty, 0);
        const totalAskQty = asks.reduce((acc, a) => acc + a.qty, 0);

        const volume = Math.floor(totalBidQty * totalAskQty / 100);
        const oi = Math.floor(volume * 1.5);

        return { bids, asks, totalBidQty, totalAskQty, volume, oi };
    }, [currentPrice]);

    return (
        <div className="flex flex-col text-xs font-mono border-t border-border mt-2 pt-2 gap-2 pb-2">
            <div className="flex justify-between items-center text-muted-foreground font-semibold px-2 uppercase text-[10px]">
                <span>Market Depth</span>
                <span className="text-secondary-foreground">Simulated</span>
            </div>

            <div className="flex gap-2 px-2">
                {/* Bids */}
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-muted-foreground border-b pb-1 text-[10px]">
                        <span>BID QTY</span>
                        <span>PRICE</span>
                    </div>
                    {bids.map((b, i) => (
                        <div key={i} className="flex justify-between text-profit">
                            <span className="opacity-80">{b.qty}</span>
                            <span>{b.price.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between border-t pt-1 font-bold text-profit">
                        <span>{totalBidQty}</span>
                        <span>Total</span>
                    </div>
                </div>

                {/* Asks */}
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-muted-foreground border-b pb-1 text-[10px]">
                        <span>PRICE</span>
                        <span>ASK QTY</span>
                    </div>
                    {asks.map((a, i) => (
                        <div key={i} className="flex justify-between text-destructive">
                            <span>{a.price.toFixed(2)}</span>
                            <span className="opacity-80">{a.qty}</span>
                        </div>
                    ))}
                    <div className="flex justify-between border-t pt-1 font-bold text-destructive">
                        <span>Total</span>
                        <span>{totalAskQty}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 px-2 text-[11px] bg-muted/30 py-2 rounded">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-semibold">{volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Open Int</span>
                    <span className="font-semibold">{oi.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
