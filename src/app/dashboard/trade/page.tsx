'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StockChart from '@/components/dashboard/StockChart';
import { Search, Star, Loader2, AlertCircle, TrendingUp, WalletCards } from 'lucide-react';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSearchParams, useRouter } from 'next/navigation';
import { MiniWatchlist } from '@/components/dashboard/MiniWatchlist';
import { MultiChartLayout } from '@/components/dashboard/MultiChartLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TradePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const rawSymbol = searchParams.get('symbol');
    const symbol = rawSymbol || 'RELIANCE';
    const initialAction = (searchParams.get('action')?.toUpperCase() || 'BUY') as 'BUY' | 'SELL';

    const [qty, setQty] = useState(1);
    const [orderType, setOrderType] = useState<'BUY' | 'SELL'>(initialAction);
    const [instrumentType, setInstrumentType] = useState<'MIS' | 'CNC'>('MIS');
    const [tradeOrderType, setTradeOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
    const [requestedPrice, setRequestedPrice] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [executing, setExecuting] = useState(false);

    // UI state for mobile
    const [mobileTab, setMobileTab] = useState<'CHART' | 'ORDER'>('CHART');

    // Sync symbol to URL if it's completely missing, so MiniWatchlist can highlight the default
    useEffect(() => {
        if (!rawSymbol) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('symbol', 'RELIANCE');
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [rawSymbol, router, searchParams]);

    // Listen to URL changes to update local action state (e.g. user clicks "Exit" from Portfolio)
    useEffect(() => {
        const urlAction = searchParams.get('action')?.toUpperCase() as 'BUY' | 'SELL';
        if (urlAction && ['BUY', 'SELL'].includes(urlAction)) {
            setOrderType(urlAction);
            // On mobile, if an action is specifically requested via URL, take them to the order form
            if (window.innerWidth < 1024) {
                setMobileTab('ORDER');
            }
        }
    }, [searchParams]);

    const { data: marketData, loading: marketLoading } = useMarketData(symbol);
    const { balance, holdings, refresh: refreshPortfolio } = usePortfolio();

    const currentPrice = marketData?.[0]?.price || 0;

    // Determine the reference price for margin calculations
    const refPrice = tradeOrderType === 'MARKET' ? currentPrice : (Number(requestedPrice) || Number(triggerPrice) || currentPrice);
    const tradeValue = refPrice * qty;

    // Exact Zerodha Margin & Brokerage Equivalence
    const requiredMargin = instrumentType === 'MIS' ? tradeValue / 5 : tradeValue;

    let brokerage = 0;
    let stt = 0;
    const exchangeReqCharges = tradeValue * 0.0000345; // Approx 0.00345% NSE txn charge

    if (instrumentType === 'MIS') {
        brokerage = Math.min(tradeValue * 0.0003, 20);
        stt = orderType === 'SELL' ? tradeValue * 0.00025 : 0; // STT mostly applies on sell side for intraday
    } else {
        brokerage = 0; // Eq Delivery is 0 brokerage
        stt = tradeValue * 0.001; // STT is 0.1% for delivery buy/sell
    }

    const gst = (brokerage + exchangeReqCharges) * 0.18; // 18% GST on services
    const totalCharges = brokerage + stt + exchangeReqCharges + gst;

    // Find live open position for PnL
    const existingPosition = holdings?.find(h => h.symbol === symbol);
    const livePnL = (existingPosition && existingPosition.pnl !== undefined) ? existingPosition.pnl : 0;

    useEffect(() => {
        const checkWatchlist = async () => {
            try {
                const res = await fetch('/api/watchlist');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setIsWatchlisted(data.includes(symbol));
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkWatchlist();
    }, [symbol]);

    const toggleWatchlist = async () => {
        try {
            const method = isWatchlisted ? 'DELETE' : 'POST';
            await fetch('/api/watchlist', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
            });
            setIsWatchlisted(!isWatchlisted);
        } catch (e) {
            console.error(e);
        }
    };

    const executeOrder = async () => {
        setExecuting(true);
        try {
            const reqPriceNum = Number(requestedPrice);
            const trigPriceNum = Number(triggerPrice);

            if (tradeOrderType === 'LIMIT' && !reqPriceNum) throw new Error("Please enter a valid limit price");
            if ((tradeOrderType === 'SL' || tradeOrderType === 'SL-M') && !trigPriceNum) throw new Error("Please enter a valid trigger price");
            if (tradeOrderType === 'SL' && !reqPriceNum) throw new Error("Please enter a valid limit price for SL order");

            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    type: orderType,
                    qty,
                    price: currentPrice, // Current live market price as reference
                    instrument_type: instrumentType,
                    order_type: tradeOrderType,
                    requested_price: tradeOrderType === 'MARKET' || tradeOrderType === 'SL-M' ? null : reqPriceNum,
                    trigger_price: tradeOrderType === 'MARKET' || tradeOrderType === 'LIMIT' ? null : trigPriceNum
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${orderType} Order ${data.status === 'PENDING' ? 'Placed' : 'Executed'} Successfully!`);
                refreshPortfolio();
                if (window.innerWidth < 1024) {
                    setMobileTab('CHART');
                }
            } else {
                toast.error(`Order Failed: ${data.error}`);
            }
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col -mx-4 -mt-4 -mb-4 px-4 bg-muted/20 relative">
            {/* Top Bar for Mobile */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-background border-b z-10 shrink-0">
                <div className="font-bold flex items-center gap-2">
                    {symbol}
                    <button onClick={toggleWatchlist}>
                        <Star className={cn("h-4 w-4", isWatchlisted ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                    </button>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border uppercase">NSE</span>
                </div>
                <div className={cn("text-sm font-bold font-mono tracking-tight",
                    marketData?.[0]?.change >= 0 ? "text-profit" : "text-destructive"
                )}>
                    ₹{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="flex lg:hidden bg-card border-b shrink-0 z-10 w-full">
                <button
                    className={cn("flex-1 py-3 text-sm font-bold border-b-2 transition-colors",
                        mobileTab === 'CHART' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
                    onClick={() => setMobileTab('CHART')}
                >
                    CHART
                </button>
                <button
                    className={cn("flex-1 py-3 text-sm font-bold border-b-2 transition-colors",
                        mobileTab === 'ORDER' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
                    onClick={() => setMobileTab('ORDER')}
                >
                    ORDER
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Panel 1: Watchlist (Hidden on smaller screens) */}
                <div className="hidden lg:flex w-[320px] flex-col border-r bg-background shrink-0 shadow-sm z-10">
                    <MiniWatchlist />
                </div>

                {/* Panel 2: Chart */}
                <div className={cn(
                    "flex-1 flex-col bg-background relative z-0",
                    mobileTab === 'CHART' ? "flex" : "hidden lg:flex"
                )}>
                    <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b shrink-0">
                        <div className="flex items-center gap-4">
                            <h2 className="font-bold text-xl tracking-tight flex items-center gap-2">
                                {symbol}
                                <button onClick={toggleWatchlist} className="hover:bg-muted p-1 rounded transition-colors">
                                    <Star className={cn("h-5 w-5", isWatchlisted ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                                </button>
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-lg font-bold font-mono",
                                    marketData?.[0]?.change >= 0 ? "text-profit" : "text-destructive"
                                )}>
                                    ₹{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                </span>
                                {marketData?.[0]?.change && (
                                    <span className="text-sm text-muted-foreground font-mono mt-0.5">
                                        {marketData[0].change > 0 ? '+' : ''}{marketData[0].change.toFixed(2)} ({marketData[0].changePercent?.toFixed(2)}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden p-0 lg:p-2 pb-20 lg:pb-2 flex">
                        {/* Wrapper to isolate chart stacking */}
                        <div className="flex-1 w-full lg:rounded-md lg:border shadow-sm overflow-hidden bg-card relative">
                            <MultiChartLayout symbol={symbol} />
                        </div>
                    </div>
                </div>

                {/* Panel 3: Order Panel */}
                <div className={cn(
                    "w-full lg:w-[350px] flex-col border-l bg-background shrink-0 z-10 shadow-sm overflow-y-auto pb-20 lg:pb-0",
                    mobileTab === 'ORDER' ? "flex" : "hidden lg:flex"
                )}>
                    {/* Header Tabs */}
                    <div className="flex px-4 py-3 border-b bg-muted/10 shrink-0">
                        <button
                            onClick={() => setOrderType('BUY')}
                            className={cn(
                                "flex-1 pb-2 pt-1 text-sm font-bold border-b-2 transition-colors",
                                orderType === 'BUY' ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            BUY {symbol}
                        </button>
                        <button
                            onClick={() => setOrderType('SELL')}
                            className={cn(
                                "flex-1 pb-2 pt-1 text-sm font-bold border-b-2 transition-colors",
                                orderType === 'SELL' ? "border-red-600 text-red-600" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            SELL {symbol}
                        </button>
                    </div>

                    <div className="p-5 flex-1 space-y-6">
                        {/* Product Type toggle (Intraday/Delivery) */}
                        <div className="flex gap-2 p-1 bg-muted rounded-md text-xs font-semibold">
                            <button
                                onClick={() => setInstrumentType('MIS')}
                                className={cn("flex-1 py-1.5 rounded shadow-sm", instrumentType === 'MIS' ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/50 hover:text-foreground/80")}
                            >
                                Intraday (MIS)
                            </button>
                            <button
                                onClick={() => setInstrumentType('CNC')}
                                className={cn("flex-1 py-1.5 rounded shadow-sm", instrumentType === 'CNC' ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/50 hover:text-foreground/80")}
                            >
                                Longterm (CNC)
                            </button>
                        </div>

                        {/* Order Type UI */}
                        <div className="flex gap-2">
                            {['MARKET', 'LIMIT', 'SL', 'SL-M'].map((ot) => (
                                <button
                                    key={ot}
                                    onClick={() => setTradeOrderType(ot as any)}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-semibold rounded border transition-colors",
                                        tradeOrderType === ot ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {ot}
                                </button>
                            ))}
                        </div>

                        {/* Order Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Qty</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                                    className="h-10 text-right font-mono"
                                />
                            </div>

                            {/* Price / Trigger Inputs */}
                            {tradeOrderType === 'MARKET' ? (
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="font-mono font-bold tracking-tight text-primary">Market</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase flex justify-between">
                                        <span>Price</span>
                                        {tradeOrderType === 'SL-M' && <span className="text-accent-foreground lowercase">market</span>}
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.05"
                                        placeholder={currentPrice.toString()}
                                        disabled={tradeOrderType === 'SL-M'}
                                        value={tradeOrderType === 'SL-M' ? '' : requestedPrice}
                                        onChange={(e) => setRequestedPrice(e.target.value)}
                                        className="h-10 text-right font-mono disabled:opacity-50"
                                    />
                                </div>
                            )}
                        </div>

                        {(tradeOrderType === 'SL' || tradeOrderType === 'SL-M') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-start-2 space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase flex justify-between">
                                        Trigger Price
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.05"
                                        placeholder="0.00"
                                        value={triggerPrice}
                                        onChange={(e) => setTriggerPrice(e.target.value)}
                                        className="h-10 text-right font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Open Position details (if any) */}
                        {existingPosition && (
                            <div className="p-3 bg-accent rounded-md border border-border">
                                <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Open Position</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-mono">{existingPosition.qty} shares</span>
                                    <span className={cn(
                                        "text-sm font-bold font-mono",
                                        livePnL >= 0 ? "text-profit" : "text-destructive"
                                    )}>
                                        {livePnL >= 0 ? '+' : ''}₹{livePnL?.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Margin Required</span>
                                <span className="font-mono font-medium">₹{requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1 border-b border-dashed border-muted-foreground cursor-help" title="Brokerage + STT + Exch Charges (~0.04%)">Est. Charges</span>
                                <span className="font-mono font-medium">₹{totalCharges.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-auto hidden lg:block">
                            <Button
                                className={cn(
                                    "w-full h-12 text-sm font-bold shadow-lg uppercase tracking-wide",
                                    orderType === 'BUY' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                                )}
                                onClick={executeOrder}
                                disabled={executing || currentPrice === 0}
                            >
                                {executing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> EXECUTING...</>
                                ) : (
                                    `PLACE ${orderType} ORDER`
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Buy/Sell Buttons */}
            {mobileTab === 'CHART' && (
                <div className="lg:hidden absolute bottom-2 left-0 right-0 p-3 bg-background/90 backdrop-blur border-t shadow-[0_-10px_20px_rgba(0,0,0,0.1)] flex gap-3 z-20">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md rounded-xl text-md" onClick={() => { setOrderType('BUY'); setMobileTab('ORDER'); }}>BUY</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-md rounded-xl text-md" onClick={() => { setOrderType('SELL'); setMobileTab('ORDER'); }}>SELL</Button>
                </div>
            )}

            {/* Sticky Mobile Submit Order Button */}
            {mobileTab === 'ORDER' && (
                <div className="lg:hidden absolute bottom-2 left-0 right-0 p-3 bg-background/90 backdrop-blur border-t shadow-[0_-10px_20px_rgba(0,0,0,0.1)] flex gap-3 z-20">
                    <Button
                        className={cn(
                            "flex-1 h-12 text-md font-bold shadow-md rounded-xl uppercase tracking-wide",
                            orderType === 'BUY' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                        )}
                        onClick={executeOrder}
                        disabled={executing || currentPrice === 0}
                    >
                        {executing ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> EXECUTING...</>
                        ) : (
                            `PLACE ${orderType} ORDER`
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
