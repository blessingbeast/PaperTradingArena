'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StockChart from '@/components/dashboard/StockChart';
import { Search, Star, Loader2, AlertCircle, TrendingUp, WalletCards, Shield } from 'lucide-react';
import { StockSearch } from '@/components/dashboard/StockSearch';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSearchParams, useRouter } from 'next/navigation';
import { MiniWatchlist } from '@/components/dashboard/MiniWatchlist';
import { MultiChartLayout } from '@/components/dashboard/MultiChartLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MarketDepth } from "@/components/dashboard/MarketDepth";
import { LivePnLWidget } from "@/components/dashboard/LivePnLWidget";
import { Maximize2, Minimize2, ChevronDown, X, Layers } from "lucide-react";
import stocksData from '@/data/stocks.json';
import { InteractiveTour } from '@/components/dashboard/InteractiveTour';

function stringToColour(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

interface TradeDashboardProps {
    defaultSymbol?: string;
    assetClass?: 'EQ' | 'FUT' | 'OPT';
    defaultLotSize?: number;
}

export function TradeDashboard({
    defaultSymbol = 'RELIANCE',
    assetClass = 'EQ',
    defaultLotSize = 1
}: TradeDashboardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const rawSymbol = searchParams.get('symbol');
    const symbol = rawSymbol || defaultSymbol;
    const initialAction = (searchParams.get('action')?.toUpperCase() || 'BUY') as 'BUY' | 'SELL';

    // Read asset class and lot size from search parameters (with prop fallbacks)
    const urlAssetClass = searchParams.get('asset_class') as 'EQ' | 'FUT' | 'OPT';
    const effectiveAssetClass = urlAssetClass || assetClass;
    const urlLotSize = searchParams.get('lot_size') ? parseInt(searchParams.get('lot_size')!) : null;

    // Automatically switch to LIMIT order and fill price if navigating from Option Chain
    const initialPrice = searchParams.get('price') || '';
    const initialTradeOrderType = initialPrice ? 'LIMIT' : 'MARKET';

    const [qty, setQty] = useState<number | ''>(1);
    const [lotSize, setLotSize] = useState<number | ''>(urlLotSize || defaultLotSize);
    const [orderType, setOrderType] = useState<'BUY' | 'SELL'>(initialAction);
    const [instrumentType, setInstrumentType] = useState<'MIS' | 'CNC'>('MIS');
    const [tradeOrderType, setTradeOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>(initialTradeOrderType);
    const [requestedPrice, setRequestedPrice] = useState(initialPrice);
    const [triggerPrice, setTriggerPrice] = useState('');
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [executing, setExecuting] = useState(false);

    // UI state for mobile
    const [mobileTab, setMobileTab] = useState<'CHART' | 'ORDER' | 'WATCHLIST'>('CHART');

    // Layout state
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(true);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);

    // Lifted Chart State
    const [chartInterval, setChartInterval] = useState('1day');
    const [layoutMode, setLayoutMode] = useState<'SINGLE' | 'SPLIT' | 'COMPARE'>('SINGLE');
    const [secondarySymbol, setSecondarySymbol] = useState('');
    const [showCompareSearch, setShowCompareSearch] = useState(false);

    // Sync symbol to URL if it's completely missing, so MiniWatchlist can highlight the default
    useEffect(() => {
        if (!rawSymbol) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('symbol', defaultSymbol);
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [rawSymbol, router, searchParams, defaultSymbol]);

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
    const { balance: realBalance, holdings, refresh: refreshPortfolio } = usePortfolio();

    const isDemo = searchParams.get('demo') === 'true';
    const balance = isDemo ? 100000 : realBalance;

    const currentPrice = marketData?.[0]?.price || 0;
    const highPrice = marketData?.[0]?.high;
    const lowPrice = marketData?.[0]?.low;
    const volume = marketData?.[0]?.volume;

    // Determine the reference price for margin calculations
    const refPrice = tradeOrderType === 'MARKET' ? currentPrice : (Number(requestedPrice) || Number(triggerPrice) || currentPrice);

    // For F&O qty means lots. actual shares = qty * lotSize
    const numQty = Number(qty) || 0;
    const actualShares = numQty * Number(lotSize || 1);
    const tradeValue = refPrice * actualShares;

    // Margin Requirements
    let requiredMargin = 0;
    if (assetClass === 'EQ') {
        requiredMargin = instrumentType === 'MIS' ? tradeValue / 5 : tradeValue;
    } else if (assetClass === 'FUT') {
        // Futures require ~20% margin
        requiredMargin = tradeValue * 0.2;
    } else if (assetClass === 'OPT') {
        if (orderType === 'BUY') requiredMargin = tradeValue; // 100% premium
        else requiredMargin = tradeValue * 3; // 300% premium simulating SPAN
    }

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
                if (isDemo) {
                    setIsWatchlisted(['RELIANCE', 'TCS', 'HDFCBANK'].includes(symbol));
                    return;
                }
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setOrderType('BUY');
                setMobileTab('ORDER');
            } else if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                setOrderType('SELL');
                setMobileTab('ORDER');
            } else if (e.key === 'Escape') {
                setRequestedPrice('');
                setTriggerPrice('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleWatchlist = async () => {
        try {
            const isDemo = searchParams.get('demo') === 'true';
            if (isDemo) {
                setIsWatchlisted(!isWatchlisted);
                return;
            }
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

    // Find stock details from JSON
    const stockDetails = stocksData.find(s => s.symbol === symbol) || { name: symbol, sector: "Unknown", exchange: "NSE" };
    // TypeScript might complain if `sector` isn't on all json models, so we'll fallback to "Unknown"
    const companyName = stockDetails.name || symbol;
    const initial = companyName.charAt(0).toUpperCase();
    const logoColor = stringToColour(companyName);
    const sectorTag = (stockDetails as any).sector || "Equity";

    const executeOrder = async () => {
        setExecuting(true);
        try {
            const reqPriceNum = Number(requestedPrice);
            const trigPriceNum = Number(triggerPrice);

            if (tradeOrderType === 'LIMIT' && !reqPriceNum) throw new Error("Please enter a valid limit price");
            if ((tradeOrderType === 'SL' || tradeOrderType === 'SL-M') && !trigPriceNum) throw new Error("Please enter a valid trigger price");
            if (tradeOrderType === 'SL' && !reqPriceNum) throw new Error("Please enter a valid limit price for SL order");

            const isDemo = searchParams.get('demo') === 'true';
            if (isDemo) {
                await new Promise(r => setTimeout(r, 800)); // Simulate fake delay
                toast.custom((t) => (
                    <div className="bg-card border border-border rounded-lg shadow-xl p-4 w-[340px] flex flex-col gap-2 relative overflow-hidden animate-in slide-in-from-top-2">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", orderType === 'BUY' ? "bg-profit" : "bg-destructive")} />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order Executed</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-bold">DEMO</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                            <h3 className="text-lg font-bold tracking-tight">
                                <span className={cn("mr-2", orderType === 'BUY' ? "text-profit" : "text-destructive")}>{orderType}</span>
                                {symbol}
                            </h3>
                            <span className="font-mono font-bold text-base">₹{currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Quantity</span>
                                <span className="font-medium font-mono">{qty}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Type</span>
                                <span className="font-medium">{tradeOrderType}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground">Status</span>
                                <span className="font-bold text-profit flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-profit"></span> COMPLETE</span>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
                refreshPortfolio();
                if (window.innerWidth < 1024) {
                    setMobileTab('CHART');
                }
                return;
            }

            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    type: orderType,
                    qty: Number(qty) || 1,
                    price: currentPrice, // Current live market price as reference
                    instrument_type: instrumentType,
                    order_type: tradeOrderType,
                    asset_class: effectiveAssetClass,
                    lot_size: lotSize,
                    requested_price: tradeOrderType === 'MARKET' || tradeOrderType === 'SL-M' ? null : reqPriceNum,
                    trigger_price: tradeOrderType === 'MARKET' || tradeOrderType === 'LIMIT' ? null : trigPriceNum,
                    // Pass F&O metadata from URL if present
                    option_type: searchParams.get('option_type'),
                    strike_price: searchParams.get('strike_price') ? parseFloat(searchParams.get('strike_price')!) : null,
                    expiry_date: searchParams.get('expiry_date'),
                    underlying_symbol: searchParams.get('underlying_symbol')
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.custom((t) => (
                    <div className="bg-card border border-border rounded-lg shadow-xl p-4 w-[340px] flex flex-col gap-2 relative overflow-hidden animate-in slide-in-from-top-2">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", orderType === 'BUY' ? "bg-profit" : "bg-destructive")} />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order Executed</span>
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-mono font-bold">LIVE</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                            <h3 className="text-lg font-bold tracking-tight">
                                <span className={cn("mr-2", orderType === 'BUY' ? "text-profit" : "text-destructive")}>{orderType}</span>
                                {symbol}
                            </h3>
                            <span className="font-mono font-bold text-base">₹{currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Quantity</span>
                                <span className="font-medium font-mono">{qty}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Type</span>
                                <span className="font-medium">{tradeOrderType}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground">Status</span>
                                <span className="font-bold text-profit flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-profit"></span> COMPLETE</span>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
                refreshPortfolio();
                if (window.innerWidth < 1024) {
                    setMobileTab('CHART');
                }
            } else {
                toast.custom((t) => (
                    <div className="bg-card border border-border border-l-4 border-l-destructive rounded-lg shadow-xl p-4 w-[340px] flex flex-col gap-1 relative overflow-hidden">
                        <h3 className="text-destructive font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Order Failed
                        </h3>
                        <p className="text-sm text-muted-foreground">{data.error || data.message || 'Failed to place order. Try again.'}</p>
                    </div>
                ), { duration: 5000 });
            }
        } catch (e: any) {
            toast.custom((t) => (
                <div className="bg-card border border-border border-l-4 border-l-destructive rounded-lg shadow-xl p-4 w-[340px] flex flex-col gap-1 relative overflow-hidden">
                    <h3 className="text-destructive font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Network Error
                    </h3>
                    <p className="text-sm text-muted-foreground">{e.message || 'Check your connection and try again.'}</p>
                </div>
            ), { duration: 5000 });
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="trade-theme-light h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-background text-foreground">
            <InteractiveTour />

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
                        mobileTab === 'WATCHLIST' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
                    onClick={() => setMobileTab('WATCHLIST')}
                >
                    WATCHLIST
                </button>
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

            <div className="hidden lg:flex flex-1 overflow-hidden p-4 gap-4">
                {/* 1. Watchlist Panel (Fixed Width) - Kept mounted to prevent refetch */}
                <div className={cn(
                    "shrink-0 bg-card rounded-xl border shadow-sm flex flex-col z-10 relative transition-all duration-300 ease-in-out",
                    isWatchlistOpen ? "w-[280px] opacity-100" : "w-0 opacity-0 overflow-hidden border-none"
                )}>
                    <div className="w-[280px] h-full flex flex-col">
                        <MiniWatchlist />
                    </div>
                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsWatchlistOpen(false)}
                        className={cn("absolute top-1/2 -right-6 z-50 bg-background hover:bg-muted text-foreground w-6 h-12 flex items-center justify-center rounded-r-md cursor-pointer transition-colors border-y border-r shadow-sm", !isWatchlistOpen && "hidden")}
                        title="Collapse Watchlist"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                </div>

                {/* Expand Button (shown when collapsed) */}
                {!isWatchlistOpen && (
                    <div className="w-0 shrink-0 border-r bg-background relative z-20">
                        <button
                            onClick={() => setIsWatchlistOpen(true)}
                            className="absolute top-1/2 -left-4 z-50 bg-card hover:bg-muted text-foreground w-6 h-12 flex items-center justify-center rounded-r-md cursor-pointer transition-colors border-y border-r shadow-sm"
                            title="Expand Watchlist"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                )}

                {/* 2. Center Chart Panel (Flex-1) */}
                <div className="flex-1 flex flex-col h-full bg-transparent relative z-0 min-w-0">
                    <div className="flex-1 overflow-y-auto w-full p-2 pb-2 flex flex-col hide-scrollbar">
                        {/* 2a. Active Position Card (Restyled) */}
                        <div className="w-full mb-3 shrink-0">
                            <LivePnLWidget symbol={symbol} currentPrice={currentPrice} />
                        </div>

                        {/* 2b. Main Chart Container */}
                        <div className="w-full max-h-[75vh] min-h-[500px] flex-1 rounded-xl border shadow-sm overflow-hidden bg-card relative">
                            <MultiChartLayout
                                symbol={symbol}
                                interval={chartInterval}
                                onIntervalChange={setChartInterval}
                                mode={layoutMode}
                                secondarySymbol={secondarySymbol}
                                onSecondarySymbolClear={() => { setLayoutMode('SINGLE'); setSecondarySymbol(''); }}
                                onSearchRequest={() => setShowCompareSearch(true)}
                            />
                        </div>
                        <div className="text-center pt-2 pb-1 shrink-0 mt-auto">
                            <p className="text-[10px] text-muted-foreground font-medium italic flex items-center justify-center gap-1.5 opacity-60">
                                <Shield className="w-3 h-3" /> Trades executed using simulated NSE/BSE data. Educational only.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Right Order Panel (Fixed Width) */}
                <div className="w-[320px] shrink-0 bg-card rounded-xl border shadow-sm z-10 overflow-y-auto hidden lg:flex flex-col tour-order-panel">
                    {/* Header Tabs */}
                    <div className="flex px-4 py-3 border-b bg-muted/30 shrink-0">
                        <button
                            onClick={() => setOrderType('BUY')}
                            className={cn(
                                "flex-1 pb-2 pt-1 text-sm font-bold border-b-2 transition-colors",
                                orderType === 'BUY' ? "border-green-600 text-green-600" : "border-transparent text-muted-foreground hover:text-foreground"
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

                    <div className="p-4 flex-1 flex flex-col pt-4">
                        <div className="space-y-5">
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
                                            "flex-1 py-1.5 text-[11px] font-bold rounded border transition-colors",
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
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {assetClass === 'EQ' ? 'Qty.' : 'Lots'}
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={qty}
                                        onChange={(e) => setQty(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                        className="h-10 text-right font-mono"
                                    />
                                    {assetClass !== 'EQ' && (
                                        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                            <span>Lot Size:</span>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={lotSize}
                                                readOnly
                                                disabled
                                                className="h-5 w-14 text-right px-1 py-0 text-[10px] bg-muted cursor-not-allowed"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Price / Trigger Inputs */}
                                {tradeOrderType === 'MARKET' ? (
                                    <div className="space-y-2 flex flex-col justify-end pb-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                                            <span className="font-mono text-xs font-bold tracking-tight text-primary bg-primary/10 px-2 py-0.5 rounded">Market</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                                            <span>Price</span>
                                            {tradeOrderType === 'SL-M' && <span className="text-accent-foreground lowercase">mkt</span>}
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.05"
                                            placeholder={currentPrice.toString()}
                                            disabled={tradeOrderType === 'SL-M'}
                                            value={tradeOrderType === 'SL-M' ? '' : requestedPrice}
                                            onChange={(e) => setRequestedPrice(e.target.value)}
                                            className="h-9 text-right font-mono disabled:opacity-50"
                                        />
                                    </div>
                                )}
                            </div>

                            {(tradeOrderType === 'SL' || tradeOrderType === 'SL-M') && (
                                <div className="grid grid-cols-2 gap-4 -mt-2">
                                    <div className="col-start-2 space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                                            Trigger Price
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.05"
                                            placeholder="0.00"
                                            value={triggerPrice}
                                            onChange={(e) => setTriggerPrice(e.target.value)}
                                            className="h-9 text-right font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            <MarketDepth symbol={symbol} currentPrice={currentPrice} />
                        </div>

                        <div className="mt-auto space-y-4">
                            {/* Margin & Risk details */}
                            <div className="pt-3 border-t space-y-1.5 pb-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">Margin Required</span>
                                    <span className="font-mono font-bold">₹{requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">Available Margin</span>
                                    <span className="font-mono font-bold text-muted-foreground">₹{(balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                {balance && balance > 0 && requiredMargin > 0 && (
                                    <div className="flex justify-between text-[11px] mt-1 overflow-hidden rounded bg-muted h-1 border border-border">
                                        <div className={cn("h-full transition-all", (requiredMargin / balance) > 0.8 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min((requiredMargin / balance) * 100, 100)}%` }}></div>
                                    </div>
                                )}
                                <div className="flex justify-between text-[10px] mt-1">
                                    <span className="text-muted-foreground flex items-center gap-1 border-b border-dashed border-muted-foreground cursor-help" title="Brokerage + STT + Exch Charges (~0.04%)">Est. Charges</span>
                                    <span className="font-mono font-medium">₹{totalCharges.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="hidden lg:block pb-2">
                                <Button
                                    className={cn(
                                        "w-full h-12 text-sm font-bold shadow-lg uppercase tracking-wider rounded-xl transition-transform hover:scale-[1.02]",
                                        orderType === 'BUY' ? "bg-gradient-to-b from-[#16A34A] to-[#15803d] hover:brightness-110 text-white border border-[#14532d]" : "bg-gradient-to-b from-[#DC2626] to-[#b91c1c] hover:brightness-110 text-white border border-[#7f1d1d]"
                                    )}
                                    onClick={executeOrder}
                                    disabled={executing || currentPrice === 0 || requiredMargin > (balance || 0)}
                                >
                                    {executing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> EXECUTING...</>
                                    ) : requiredMargin > (balance || 0) ? (
                                        "INSUFFICIENT MARGIN"
                                    ) : (
                                        `PLACE ${orderType} ORDER`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Tab: WATCHLIST */}
            <div className={cn(
                "flex-1 flex-col bg-background relative z-0 pb-24",
                mobileTab === 'WATCHLIST' ? "flex lg:hidden" : "hidden"
            )}>
                <MiniWatchlist />
            </div>

            {/* Mobile Tab: CHART */}
            <div className={cn(
                "flex-1 flex-col bg-background relative z-0",
                mobileTab === 'CHART' ? "flex lg:hidden" : "hidden"
            )}>
                <div className="flex-1 overflow-hidden p-0 pb-36 flex">
                    <div className="flex-1 w-full bg-card relative">
                        <MultiChartLayout symbol={symbol} />
                    </div>
                </div>
            </div>

            <div className={cn(
                "w-full flex-col bg-background shrink-0 z-10 shadow-sm overflow-y-auto pb-40",
                mobileTab === 'ORDER' ? "flex lg:hidden" : "hidden"
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
                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                {assetClass === 'EQ' ? 'Qty' : 'Lots'}
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                                className="h-10 text-right font-mono"
                            />
                            {assetClass !== 'EQ' && (
                                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                    <span>Lot Size:</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={lotSize}
                                        readOnly
                                        disabled
                                        className="h-6 w-16 text-right px-2 py-0 bg-muted cursor-not-allowed"
                                    />
                                </div>
                            )}
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
                </div>
            </div>

            {/* Sticky Mobile Buy/Sell Buttons */}
            {
                mobileTab === 'CHART' && (
                    <div className="lg:hidden absolute bottom-20 left-0 right-0 p-3 bg-background/90 backdrop-blur border-t shadow-[0_-10px_20px_rgba(0,0,0,0.1)] flex gap-3 z-20">
                        <Button className="flex-1 bg-gradient-to-b from-[#16A34A] to-[#15803d] border border-[#14532d] hover:brightness-110 text-white font-bold h-12 shadow-md rounded-xl text-md" onClick={() => { setOrderType('BUY'); setMobileTab('ORDER'); }}>BUY</Button>
                        <Button className="flex-1 bg-gradient-to-b from-[#DC2626] to-[#b91c1c] border border-[#7f1d1d] hover:brightness-110 text-white font-bold h-12 shadow-md rounded-xl text-md" onClick={() => { setOrderType('SELL'); setMobileTab('ORDER'); }}>SELL</Button>
                    </div>
                )
            }

            {/* Sticky Mobile Submit Order Button */}
            {
                mobileTab === 'ORDER' && (
                    <div className="lg:hidden absolute bottom-20 left-0 right-0 p-3 bg-background/90 backdrop-blur border-t shadow-[0_-10px_20px_rgba(0,0,0,0.1)] flex gap-3 z-20">
                        <Button
                            className={cn(
                                "flex-1 h-12 text-md font-bold shadow-md rounded-xl uppercase tracking-wide",
                                orderType === 'BUY' ? "bg-gradient-to-b from-[#16A34A] to-[#15803d] border border-[#14532d] hover:brightness-110 text-white" : "bg-gradient-to-b from-[#DC2626] to-[#b91c1c] border border-[#7f1d1d] hover:brightness-110 text-white"
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
                )
            }

            {/* Chart Fullscreen Modal */}
            {
                isChartModalOpen && (
                    <div className="fixed inset-0 z-[200] bg-background flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-2 pb-4 border-b shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-2xl tracking-tight">{symbol}</h2>
                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border uppercase">NYSE / NSE</span>
                            </div>
                            <Button variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:bg-muted" onClick={() => setIsChartModalOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                            </Button>
                        </div>
                        <div className="flex-1 w-full h-full overflow-hidden pt-4 relative bg-card rounded-md border shadow-sm">
                            <MultiChartLayout symbol={symbol} />
                        </div>
                    </div>
                )}
        </div>
    );
}
