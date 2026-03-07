'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Star, PlusSquare, ShoppingBag, X, ChevronUp, ChevronDown, Activity, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { toast } from 'sonner';
import { StrategyPayoff } from './StrategyPayoff';
import { getLotSize } from '@/lib/fo-utils';

interface OptionData {
    strike: number;
    CE: any;
    PE: any;
}

interface ChainExpiry {
    expiry: string;
    daysToExpiry: number;
    options: OptionData[];
}

interface BasketItem {
    id: string;
    symbol: string;
    type: 'CE' | 'PE';
    strike: number;
    action: 'BUY' | 'SELL';
    price: number;
    qty: number;
}

export function OptionChain() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const rawSymbol = searchParams.get('symbol') || 'NIFTY';

    const [loading, setLoading] = useState(true);
    const [chainData, setChainData] = useState<ChainExpiry[]>([]);
    const [ltp, setLtp] = useState<number>(0);
    const [selectedExpiry, setSelectedExpiry] = useState<string>('');

    // Basket State
    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [executingBasket, setExecutingBasket] = useState(false);
    const [isBasketOpen, setIsBasketOpen] = useState(false);
    const [isBasketMinimized, setIsBasketMinimized] = useState(false);
    const [basketTab, setBasketTab] = useState<'legs' | 'payoff'>('legs');

    // Toggles
    const [showGreeks, setShowGreeks] = useState(false);

    useEffect(() => {
        const fetchChain = async () => {
            setLoading(true);
            try {
                const url = `/api/options-chain?symbol=${rawSymbol}${selectedExpiry ? `&expiry=${selectedExpiry}` : ''}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.chain && data.chain.length > 0) {
                    setChainData(data.chain);
                    setLtp(data.ltp);
                    if (!selectedExpiry) {
                        setSelectedExpiry(data.chain[0].expiry);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch option chain", e);
            } finally {
                setLoading(false);
            }
        };

        fetchChain();
        const interval = setInterval(fetchChain, 60000); // Poll every 60s to prevent Yahoo Rate Limiting
        return () => clearInterval(interval);
    }, [rawSymbol, selectedExpiry]);

    const currentChain = useMemo(() => {
        return chainData.find(c => c.expiry === selectedExpiry)?.options || [];
    }, [chainData, selectedExpiry]);

    const handleSymbolSelect = (sym: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('symbol', sym);
        router.push(`?${params.toString()}`);
    };

    const constructOptionSymbol = (strike: number, type: 'CE' | 'PE') => {
        const dt = new Date(selectedExpiry);
        const day = String(dt.getDate()).padStart(2, '0');
        const month = dt.toLocaleString('default', { month: 'short' }).toUpperCase();
        const year = dt.getFullYear().toString().slice(-2);

        // Standard Format: SYMBOL + YY + MMM + DD + STRIKE + TYPE
        // Example: NIFTY26MAR0525200CE
        return `${rawSymbol}${year}${month}${day}${strike}${type}`;
    };

    const handleTradeClick = (e: React.MouseEvent, strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => {
        e.stopPropagation();

        if (isBasketOpen) {
            addToBasket(e, strike, type, price, action);
            return;
        }

        const optionSymbol = constructOptionSymbol(strike, type);
        const lotSize = getLotSize(rawSymbol);

        const params = new URLSearchParams();
        params.set('symbol', optionSymbol);
        params.set('underlying', rawSymbol);
        params.set('action', action);
        params.set('price', price.toFixed(2));
        params.set('option_type', type);
        params.set('strike_price', strike.toString());
        params.set('expiry_date', selectedExpiry);
        params.set('underlying_symbol', rawSymbol);
        params.set('asset_class', 'OPT');
        params.set('lot_size', lotSize.toString());

        router.push(`/dashboard/options?${params.toString()}`);
    };

    const addToWatchlist = async (e: React.MouseEvent, strike: number, type: 'CE' | 'PE') => {
        e.stopPropagation();
        const optionSymbol = constructOptionSymbol(strike, type);
        try {
            await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: optionSymbol })
            });
            toast.success(`Added ${optionSymbol} to Watchlist`);
        } catch (e) {
            toast.error("Failed to add to watchlist");
        }
    };

    const addToBasket = (e: React.MouseEvent, strike: number, type: 'CE' | 'PE', price: number, action: 'BUY' | 'SELL' = 'BUY') => {
        e.stopPropagation();
        const optionSymbol = constructOptionSymbol(strike, type);

        setBasket(prev => {
            const existing = prev.find(item => item.symbol === optionSymbol && item.action === action);
            if (existing) {
                return prev.map(item => item.id === existing.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                symbol: optionSymbol,
                type,
                strike,
                action,
                price,
                qty: 1
            }];
        });
        toast.success(`Added ${action} ${optionSymbol} to Basket`);
    };

    const removeFromBasket = (id: string) => {
        setBasket(prev => prev.filter(item => item.id !== id));
    };

    const moveBasketItem = (index: number, direction: -1 | 1) => {
        setBasket(prev => {
            const newBasket = [...prev];
            if (index + direction < 0 || index + direction >= newBasket.length) return newBasket;
            const temp = newBasket[index];
            newBasket[index] = newBasket[index + direction];
            newBasket[index + direction] = temp;
            return newBasket;
        });
    };

    const executeBasket = async () => {
        if (basket.length === 0) return;
        setExecutingBasket(true);
        try {
            const lotSize = getLotSize(rawSymbol);

            const promises = basket.map(item =>
                fetch('/api/orders/place', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: item.symbol,
                        type: item.action,
                        qty: item.qty,
                        price: item.price,
                        instrument_type: 'MIS',
                        order_type: 'MARKET',
                        asset_class: 'OPT',
                        lot_size: lotSize,
                        requested_price: null,
                        trigger_price: null,
                        option_type: item.type,
                        strike_price: item.strike,
                        expiry_date: selectedExpiry,
                        underlying_symbol: rawSymbol
                    })
                }).then(res => res.json())
            );

            const results = await Promise.all(promises);
            const failed = results.filter(r => !r.success);

            if (failed.length > 0) {
                toast.error(`Executed with ${failed.length} errors. Margin might be insufficient.`);
            } else {
                toast.success(`Successfully executed ${basket.length} F&O orders!`);
                setBasket([]);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to execute basket orders");
        } finally {
            setExecutingBasket(false);
        }
    };

    // Calculate aggregated margins
    // Realistic Margin Calculation Simulation
    const basketReqMargin = useMemo(() => {
        const lotSize = getLotSize(rawSymbol);

        let totalBuyPremium = 0;
        let totalSellMargin = 0;
        let totalBuyLots = 0;
        let totalSellLots = 0;

        basket.forEach(item => {
            if (item.action === 'BUY') {
                totalBuyPremium += (item.price * item.qty * lotSize);
                totalBuyLots += item.qty;
            } else {
                // Rough estimate: Naked Option Selling requires ~80,000 to ~1,20,000 margin per lot depending on index
                const baseSellMarginPerLot = rawSymbol.includes('NIFTY') ? 95000 : 85000;
                totalSellMargin += (baseSellMarginPerLot * item.qty);
                totalSellLots += item.qty;
            }
        });

        // Hedging Benefit: If you buy options alongside selling, it provides margin relief (Span Margin drops).
        // A simple mockup: Every 1 Buy Lot can hedge 1 Sell Lot, dropping its required margin by ~50,000
        let hedgeBenefit = 0;
        if (totalBuyLots > 0 && totalSellLots > 0) {
            const hedgedLots = Math.min(totalBuyLots, totalSellLots);
            hedgeBenefit = hedgedLots * 50000;
        }

        const finalSellMargin = Math.max(0, totalSellMargin - hedgeBenefit);

        // Final Margin = Buy Premium (100% upfront) + Hedged Sell Margin
        return totalBuyPremium + finalSellMargin;
    }, [basket, rawSymbol]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4 relative">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex gap-2 w-full sm:w-auto items-center overflow-x-auto hide-scrollbar">
                    <div className="w-full sm:w-72 shrink-0">
                        <StockSearch onSelect={handleSymbolSelect} placeholder="Search underlying (e.g. NIFTY, RELIANCE)..." />
                    </div>

                    <Button variant={isBasketOpen ? "default" : "outline"} onClick={() => setIsBasketOpen(!isBasketOpen)} className="relative shrink-0">
                        <ShoppingBag className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{isBasketOpen ? "Strategy Mode ON" : "Build Strategy"}</span>
                        {basket.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-profit text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                {basket.length}
                            </span>
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex bg-secondary p-1 rounded-lg">
                        {chainData.map(c => (
                            <button
                                key={c.expiry}
                                onClick={() => setSelectedExpiry(c.expiry)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                                    selectedExpiry === c.expiry
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex flex-col items-center">
                                    <span>{new Date(c.expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGreeks(!showGreeks)}
                        className={cn("whitespace-nowrap", showGreeks && "bg-primary/10 border-primary/20 text-primary")}
                    >
                        {showGreeks ? "Hide Greeks" : "Show Greeks"}
                    </Button>
                </div>
            </div>

            {/* Main Table */}
            <Card className="flex-1 overflow-hidden flex flex-col border shadow-sm rounded-xl">
                <div className="flex justify-between items-center px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{rawSymbol}</span>
                        <span className="text-sm text-muted-foreground">LTP:</span>
                        <span className="font-mono font-bold text-primary">{(ltp || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto relative">
                    {loading && currentChain.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : null}

                    <table className="w-full text-sm text-right relative">
                        <thead className="sticky top-0 bg-secondary/90 backdrop-blur-md z-20 shadow-sm">
                            <tr>
                                {/* CALLS HEADER */}
                                {showGreeks && <th className="p-2 font-medium text-muted-foreground">Delta</th>}
                                {showGreeks && <th className="p-2 font-medium text-muted-foreground">Theta</th>}
                                <th className="p-2 font-medium text-muted-foreground">IV</th>
                                <th className="p-2 font-medium text-muted-foreground">Vol</th>
                                <th className="p-2 font-medium text-muted-foreground">OI</th>
                                <th className="p-2 font-bold text-foreground bg-primary/5 min-w-[160px]">CALL LTP</th>

                                {/* STRIKE HEADER */}
                                <th className="p-2 font-bold text-center bg-card shadow-sm border-x w-[80px] min-w-[80px]">STRIKE</th>

                                {/* PUTS HEADER */}
                                <th className="p-2 font-bold text-foreground bg-destructive/5 text-left min-w-[160px]">PUT LTP</th>
                                <th className="p-2 font-medium text-muted-foreground text-left">OI</th>
                                <th className="p-2 font-medium text-muted-foreground text-left">Vol</th>
                                <th className="p-2 font-medium text-muted-foreground text-left">IV</th>
                                {showGreeks && <th className="p-2 font-medium text-muted-foreground text-left">Theta</th>}
                                {showGreeks && <th className="p-2 font-medium text-muted-foreground text-left">Delta</th>}
                            </tr>
                        </thead>
                        <tbody className="font-mono">
                            {currentChain.length > 0 && (function() {
                                // Find exact ATM strike by minimal distance to LTP
                                const atmStrike = currentChain.reduce((prev, curr) => 
                                    Math.abs(curr.strike - ltp) < Math.abs(prev.strike - ltp) ? curr : prev
                                ).strike;

                                return currentChain.map((row, idx) => {
                                    const isCallITM = row.strike < ltp;
                                    const isPutITM = row.strike > ltp;
                                    const isATM = row.strike === atmStrike;

                                    return (
                                    <tr key={row.strike} className="border-b hover:bg-muted/30 group">
                                        {/* CALLS */}
                                        {showGreeks && <td className={cn("p-2", isCallITM ? "bg-amber-500/5" : "")}>{(row.CE.delta ?? 0).toFixed(2)}</td>}
                                        {showGreeks && <td className={cn("p-2", isCallITM ? "bg-amber-500/5" : "")}>{(row.CE.theta ?? 0).toFixed(2)}</td>}
                                        <td className={cn("p-2", isCallITM ? "bg-amber-500/5" : "")}>{(row.CE.iv ?? 0).toFixed(1)}</td>
                                        <td className={cn("p-2", isCallITM ? "bg-amber-500/5" : "")}>{(row.CE.vol / 1000).toFixed(1)}k</td>
                                        <td className={cn("p-2", isCallITM ? "bg-amber-500/5" : "")}>{(row.CE.oi / 100000).toFixed(1)}L</td>
                                        <td className={cn("p-2 font-bold group/ce w-[170px] min-w-[170px]", isCallITM ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "")}>
                                            <div className="flex justify-end items-center h-full min-h-[32px] w-full px-1">
                                                <span className="block group-hover/ce:hidden transition-all">{(row.CE.ltp ?? 0).toFixed(2)}</span>
                                                <div className="hidden group-hover/ce:flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-md shadow-sm border px-1 py-0.5">
                                                    <Button size="sm" className="h-7 w-7 p-0 bg-profit hover:bg-profit/90 text-white rounded font-bold text-xs shadow-sm shadow-profit/20" onClick={(e) => handleTradeClick(e, row.strike, 'CE', 'BUY', row.CE.ltp)} title={isBasketOpen ? "Add BUY to Basket" : "Buy"}>B</Button>
                                                    <Button size="sm" className="h-7 w-7 p-0 bg-destructive hover:bg-destructive/90 text-white rounded font-bold text-xs shadow-sm shadow-destructive/20" onClick={(e) => handleTradeClick(e, row.strike, 'CE', 'SELL', row.CE.ltp)} title={isBasketOpen ? "Add SELL to Basket" : "Sell"}>S</Button>
                                                    <Button size="icon" variant="outline" className="h-7 w-7 p-0 rounded shadow-sm text-muted-foreground hover:text-foreground bg-background" onClick={(e) => addToWatchlist(e, row.strike, 'CE')} title="Add to Watchlist"><Star className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </td>

                                        {/* STRIKE */}
                                        <td className={cn(
                                            "p-2 text-center font-bold bg-card border-x w-[80px] min-w-[80px] transition-colors",
                                            isATM && "bg-primary text-primary-foreground border-primary"
                                        )}>
                                            {row.strike}
                                        </td>

                                        {/* PUTS */}
                                        <td className={cn("p-2 text-left font-bold group/pe w-[170px] min-w-[170px]", isPutITM ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "")}>
                                            <div className="flex justify-start items-center h-full min-h-[32px] w-full px-1">
                                                <span className="block group-hover/pe:hidden transition-all">{(row.PE.ltp ?? 0).toFixed(2)}</span>
                                                <div className="hidden group-hover/pe:flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-md shadow-sm border px-1 py-0.5">
                                                    <Button size="sm" className="h-7 w-7 p-0 bg-profit hover:bg-profit/90 text-white rounded font-bold text-xs shadow-sm shadow-profit/20" onClick={(e) => handleTradeClick(e, row.strike, 'PE', 'BUY', row.PE.ltp)} title={isBasketOpen ? "Add BUY to Basket" : "Buy"}>B</Button>
                                                    <Button size="sm" className="h-7 w-7 p-0 bg-destructive hover:bg-destructive/90 text-white rounded font-bold text-xs shadow-sm shadow-destructive/20" onClick={(e) => handleTradeClick(e, row.strike, 'PE', 'SELL', row.PE.ltp)} title={isBasketOpen ? "Add SELL to Basket" : "Sell"}>S</Button>
                                                    <Button size="icon" variant="outline" className="h-7 w-7 p-0 rounded shadow-sm text-muted-foreground hover:text-foreground bg-background" onClick={(e) => addToWatchlist(e, row.strike, 'PE')} title="Add to Watchlist"><Star className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={cn("p-2 text-left", isPutITM ? "bg-amber-500/5" : "")}>{(row.PE.oi / 100000).toFixed(1)}L</td>
                                        <td className={cn("p-2 text-left", isPutITM ? "bg-amber-500/5" : "")}>{(row.PE.vol / 1000).toFixed(1)}k</td>
                                        <td className={cn("p-2 text-left", isPutITM ? "bg-amber-500/5" : "")}>{(row.PE.iv ?? 0).toFixed(1)}</td>
                                        {showGreeks && <td className={cn("p-2 text-left", isPutITM ? "bg-amber-500/5" : "")}>{(row.PE.theta ?? 0).toFixed(2)}</td>}
                                        {showGreeks && <td className={cn("p-2 text-left", isPutITM ? "bg-amber-500/5" : "")}>{(row.PE.delta ?? 0).toFixed(2)}</td>}
                                    </tr>
                                );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Fixed Bottom Strategy Basket Drawer */}
            {basket.length > 0 && isBasketOpen && (
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 w-full bg-card border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-2xl z-[100] flex flex-col overflow-hidden transition-all duration-300",
                    isBasketMinimized ? "h-[52px]" : "h-[300px] animate-in slide-in-from-bottom-10"
                )}>
                    {/* Basket Header */}
                    <div
                        className="flex justify-between items-center p-2 px-6 bg-muted/50 border-b w-full cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => setIsBasketMinimized(!isBasketMinimized)}
                    >
                        <div className="flex items-center gap-6">
                            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-primary" /> Strategy Builder
                                {isBasketMinimized && <span className="text-xs font-normal text-muted-foreground ml-2">({basket.length} Legs • Req Margin: ₹{basketReqMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>}
                            </h3>

                            {!isBasketMinimized && (
                                <div className="flex bg-background rounded-md p-0.5 border" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setBasketTab('legs')} className={cn("px-3 py-1 text-xs font-bold rounded-sm flex items-center gap-2 transition-colors", basketTab === 'legs' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}><ListOrdered className="w-3.5 h-3.5" /> Legs</button>
                                    <button onClick={() => setBasketTab('payoff')} className={cn("px-3 py-1 text-xs font-bold rounded-sm flex items-center gap-2 transition-colors", basketTab === 'payoff' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}><Activity className="w-3.5 h-3.5" /> Payoff Chart</button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setIsBasketMinimized(!isBasketMinimized); }}>
                                {isBasketMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setIsBasketOpen(false); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Basket Body */}
                    {!isBasketMinimized && (
                        <div className="flex-1 overflow-y-auto w-full bg-background relative flex justify-center">
                            <div className="w-full max-w-5xl flex gap-6 p-4">

                                {/* Left Side: Legs List or Graph */}
                                <div className="flex-1 max-h-[180px] overflow-y-auto pr-2">
                                    {basketTab === 'legs' ? (
                                        <div className="space-y-1">
                                            {basket.map((item, idx) => (
                                                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg text-sm border-b last:border-0 border-border/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-center opacity-50 hover:opacity-100 bg-background/50 rounded px-1">
                                                            <button onClick={() => moveBasketItem(idx, -1)} disabled={idx === 0} className="hover:text-primary disabled:opacity-30"><ChevronUp className="w-4 h-3" /></button>
                                                            <button onClick={() => moveBasketItem(idx, 1)} disabled={idx === basket.length - 1} className="hover:text-primary disabled:opacity-30"><ChevronDown className="w-4 h-3" /></button>
                                                        </div>
                                                        <span className={cn("font-bold w-12 py-0.5 text-center rounded px-1 text-[10px]", item.action === 'BUY' ? "bg-profit/10 text-profit border border-profit/20" : "bg-destructive/10 text-destructive border border-destructive/20")}>
                                                            {item.action}
                                                        </span>
                                                        <span className="font-semibold text-foreground">{item.symbol}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground tracking-tight">
                                                        <span>{item.qty} Lot(s)</span>
                                                        <span className="w-20 text-right">@ ₹{item.price.toFixed(2)}</span>
                                                        <button onClick={() => removeFromBasket(item.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive p-1.5 rounded-md transition-colors"><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 pt-0 h-full min-h-[160px]">
                                            <StrategyPayoff basket={basket} currentSpot={ltp} lotSize={getLotSize(rawSymbol)} />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Margin & Action Summary */}
                                <div className="w-[300px] flex flex-col justify-between border-l pl-6 pt-1">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Legs</span>
                                            <span className="text-sm font-bold">{basket.length} {basket.length === 1 ? 'Contract' : 'Contracts'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Req. Margin</span>
                                            <span className="font-mono text-lg font-bold text-primary">₹{basketReqMargin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full mt-4">
                                        <Button variant="outline" className="w-1/3" onClick={() => setBasket([])}>Clear</Button>
                                        <Button
                                            onClick={executeBasket}
                                            disabled={executingBasket}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md w-2/3"
                                        >
                                            {executingBasket ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ...</> : "EXECUTE"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
