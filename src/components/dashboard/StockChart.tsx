'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, MouseEventParams, IPriceLine } from 'lightweight-charts';
import { Loader2, ZoomIn, ZoomOut, ChevronDown, Maximize, Activity, Save, Check, MousePointer2, Minus, TrendingUp, Trash2 } from 'lucide-react';
import { RSI, MACD, EMA, SMA, BollingerBands, VWAP } from 'technicalindicators';
import { toast } from 'sonner';

interface StockChartProps {
    symbol: string;
    className?: string;
    isCompareMode?: boolean;
    headerRightContent?: React.ReactNode;
}

interface ChartLayoutData {
    interval: string;
    indicators: string[];
}

export default function StockChart({ symbol, className, isCompareMode = false, headerRightContent }: StockChartProps) {
    const rootContainerRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Core Series
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    // Indicator Series References
    const emaRef = useRef<ISeriesApi<"Line"> | null>(null);
    const smaRef = useRef<ISeriesApi<"Line"> | null>(null);
    const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);
    const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
    const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
    const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

    // Oscillator Panes
    const rsiPaneRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
    const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [interval, setIntervalState] = useState('1day');
    const [isLive, setIsLive] = useState(true);
    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);

    // Drawing Tools State
    const [drawingMode, setDrawingMode] = useState<'NONE' | 'HLINE' | 'TREND'>('NONE');
    const [isDrawingTrend, setIsDrawingTrend] = useState(false);
    const tempTrendPointRef = useRef<{ time: any, value: number } | null>(null);
    const trendLinesRef = useRef<ISeriesApi<"Line">[]>([]);
    const horizontalLinesRef = useRef<IPriceLine[]>([]);

    const lastCandleRef = useRef<any>(null);
    const rawDataRef = useRef<any[]>([]);

    // 1. Fetch Layout from Server on Mount
    useEffect(() => {
        if (isCompareMode) return; // Don't load saved layout for secondary compare charts
        const fetchLayout = async () => {
            try {
                const res = await fetch(`/api/chart?symbol=${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.interval) setIntervalState(data.interval);
                    if (data.indicators) setActiveIndicators(data.indicators);
                }
            } catch (err) {
                console.error("Failed to fetch layout:", err);
            }
        };
        fetchLayout();
    }, [symbol, isCompareMode]);

    // 2. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const chartOptions = {
            layout: {
                textColor: isDark ? '#d1d5db' : '#374151',
                background: { type: ColorType.Solid, color: 'transparent' },
            },
            grid: {
                vertLines: { color: isDark ? '#374151' : '#f3f4f6' },
                horzLines: { color: isDark ? '#374151' : '#f3f4f6' },
            },
            crosshair: { mode: 1 },
            rightPriceScale: { borderColor: isDark ? '#374151' : '#e5e7eb' },
            timeScale: { borderColor: isDark ? '#374151' : '#e5e7eb', timeVisible: true },
            autoSize: true,
        };

        const chart = createChart(chartContainerRef.current, chartOptions);
        chartRef.current = chart;

        // Main Price Scale configuration
        chart.priceScale('right').applyOptions({
            scaleMargins: { top: 0.1, bottom: 0.3 }, // Leave room for indicators at bottom
        });

        // Add Candlestick Series
        const mainSeries = chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
            wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        });
        seriesRef.current = mainSeries;

        // Add Volume Series (Histogram) behind price
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '',
        });
        chart.priceScale('').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeRef.current = volumeSeries;

        // Drawing Tools Click Handler
        const handleChartClick = (param: MouseEventParams) => {
            if (!param || !param.point || !param.time || !seriesRef.current) return;
            const price = seriesRef.current.coordinateToPrice(param.point.y);
            if (price === null) return;

            setDrawingMode((currentMode) => {
                if (currentMode === 'HLINE') {
                    seriesRef.current?.createPriceLine({ price: price, color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true });
                    toast.success("Horizontal Line placed!");
                    return 'NONE';
                }
                else if (currentMode === 'TREND') {
                    if (!tempTrendPointRef.current) {
                        tempTrendPointRef.current = { time: param.time, value: price };
                        toast.info("Click again to end trendline");
                        setIsDrawingTrend(true);
                        return 'TREND';
                    } else {
                        if (param.time === tempTrendPointRef.current.time) {
                            toast.error("Trendline points must be on different candles.");
                            return 'TREND'; // Stay in draw mode
                        }
                        if (chartRef.current) {
                            const tlSeries = chartRef.current.addLineSeries({ color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
                            tlSeries.setData([tempTrendPointRef.current, { time: param.time, value: price }].sort((a, b) => (a.time as number) - (b.time as number)));
                            trendLinesRef.current.push(tlSeries);
                        }
                        tempTrendPointRef.current = null;
                        setIsDrawingTrend(false);
                        toast.success("Trendline placed!");
                        return 'NONE';
                    }
                }
                return currentMode;
            });
        };
        chart.subscribeClick(handleChartClick);

        // Resize handler
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            chart.unsubscribeClick(handleChartClick);
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, []);

    // Helper: Compute built-in Technical Indicators
    const computeIndicators = useCallback((cData: any[]) => {
        if (!cData.length || !chartRef.current) return;

        const closePrices = cData.map(d => d.close);
        const highPrices = cData.map(d => d.high);
        const lowPrices = cData.map(d => d.low);
        const volumes = cData.map(d => d.volume);

        // Setup internal padding references
        let bottomScaleStart = 0.7; // Start oscillators at 70% down the screen

        // 1. OVERLAYS (EMA, SMA, BB, VWAP)
        if (activeIndicators.includes('EMA')) {
            if (!emaRef.current) emaRef.current = chartRef.current.addLineSeries({ color: '#2962FF', lineWidth: 2, title: 'EMA (20)' });
            const emaValues = EMA.calculate({ period: 20, values: closePrices });
            const paddedEma = cData.map((d, i) => ({ time: d.time, value: i >= 19 ? emaValues[i - 19] : NaN })).filter(d => !isNaN(d.value));
            emaRef.current.setData(paddedEma);
        } else if (emaRef.current) {
            chartRef.current.removeSeries(emaRef.current);
            emaRef.current = null;
        }

        if (activeIndicators.includes('SMA')) {
            if (!smaRef.current) smaRef.current = chartRef.current.addLineSeries({ color: '#FF6D00', lineWidth: 2, title: 'SMA (50)' });
            const smaValues = SMA.calculate({ period: 50, values: closePrices });
            const paddedSma = cData.map((d, i) => ({ time: d.time, value: i >= 49 ? smaValues[i - 49] : NaN })).filter(d => !isNaN(d.value));
            smaRef.current.setData(paddedSma);
        } else if (smaRef.current) {
            chartRef.current.removeSeries(smaRef.current);
            smaRef.current = null;
        }

        if (activeIndicators.includes('VWAP')) {
            if (!vwapRef.current) vwapRef.current = chartRef.current.addLineSeries({ color: '#E91E63', lineWidth: 2, title: 'VWAP' });
            // technicalindicators VWAP expects an array of objects
            const vwapInput = { high: highPrices, low: lowPrices, close: closePrices, volume: volumes };
            const vwapValues = VWAP.calculate(vwapInput);
            const paddedVwap = cData.map((d, i) => ({ time: d.time, value: vwapValues[i] || NaN })).filter(d => !isNaN(d.value));
            vwapRef.current.setData(paddedVwap);
        } else if (vwapRef.current) {
            chartRef.current.removeSeries(vwapRef.current);
            vwapRef.current = null;
        }

        if (activeIndicators.includes('BB')) {
            if (!bbUpperRef.current) {
                bbUpperRef.current = chartRef.current.addLineSeries({ color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, title: 'BB Upper' });
                bbMiddleRef.current = chartRef.current.addLineSeries({ color: 'rgba(41, 98, 255, 0.8)', lineWidth: 1, title: 'BB Basis' });
                bbLowerRef.current = chartRef.current.addLineSeries({ color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, title: 'BB Lower' });
            }
            const bbValues = BollingerBands.calculate({ period: 20, stdDev: 2, values: closePrices });
            const up = cData.map((d, i) => ({ time: d.time, value: i >= 19 ? bbValues[i - 19].upper : NaN })).filter(d => !isNaN(d.value));
            const mid = cData.map((d, i) => ({ time: d.time, value: i >= 19 ? bbValues[i - 19].middle : NaN })).filter(d => !isNaN(d.value));
            const low = cData.map((d, i) => ({ time: d.time, value: i >= 19 ? bbValues[i - 19].lower : NaN })).filter(d => !isNaN(d.value));
            bbUpperRef.current!.setData(up);
            bbMiddleRef.current!.setData(mid);
            bbLowerRef.current!.setData(low);
        } else if (bbUpperRef.current) {
            chartRef.current.removeSeries(bbUpperRef.current);
            chartRef.current.removeSeries(bbMiddleRef.current!);
            chartRef.current.removeSeries(bbLowerRef.current!);
            bbUpperRef.current = null; bbMiddleRef.current = null; bbLowerRef.current = null;
        }

        // 2. OSCILLATORS (Separate Panes)
        // Ensure price scale shrinks to fit them
        if (activeIndicators.includes('RSI') || activeIndicators.includes('MACD')) {
            chartRef.current.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.3 } });
        } else {
            chartRef.current.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
        }

        if (activeIndicators.includes('RSI')) {
            if (!rsiPaneRef.current) {
                rsiPaneRef.current = chartRef.current.addLineSeries({
                    color: '#9C27B0', lineWidth: 2, title: 'RSI (14)',
                    priceScaleId: 'rsi',
                });
                chartRef.current.priceScale('rsi').applyOptions({
                    scaleMargins: { top: bottomScaleStart, bottom: 0 },
                    borderColor: 'transparent',
                });
                bottomScaleStart -= 0.15; // Shift next pane up if needed
            }
            const rsiValues = RSI.calculate({ period: 14, values: closePrices });
            const paddedRsi = cData.map((d, i) => ({ time: d.time, value: i >= 14 ? rsiValues[i - 14] : NaN })).filter(d => !isNaN(d.value));
            rsiPaneRef.current.setData(paddedRsi);
        } else if (rsiPaneRef.current) {
            chartRef.current.removeSeries(rsiPaneRef.current);
            rsiPaneRef.current = null;
        }

        if (activeIndicators.includes('MACD')) {
            if (!macdLineRef.current) {
                macdLineRef.current = chartRef.current.addLineSeries({ color: '#2962FF', lineWidth: 2, title: 'MACD', priceScaleId: 'macd' });
                macdSignalRef.current = chartRef.current.addLineSeries({ color: '#FF6D00', lineWidth: 2, title: 'Signal', priceScaleId: 'macd' });
                macdHistRef.current = chartRef.current.addHistogramSeries({ priceScaleId: 'macd' });
                chartRef.current.priceScale('macd').applyOptions({
                    scaleMargins: { top: bottomScaleStart, bottom: 0 },
                    borderColor: 'transparent',
                });
            }
            const macdValues = MACD.calculate({ values: closePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
            // MACD library returns an array of { MACD, signal, histogram }
            const startIdx = closePrices.length - macdValues.length;

            const mLine = cData.map((d, i) => ({ time: d.time, value: i >= startIdx && macdValues[i - startIdx] ? macdValues[i - startIdx].MACD : NaN })).filter(d => !isNaN(d.value!));
            const sLine = cData.map((d, i) => ({ time: d.time, value: i >= startIdx && macdValues[i - startIdx] ? macdValues[i - startIdx].signal : NaN })).filter(d => !isNaN(d.value!));
            const hLine = cData.map((d, i) => {
                if (i >= startIdx && macdValues[i - startIdx]) {
                    const val = macdValues[i - startIdx].histogram;
                    return { time: d.time, value: val, color: val! >= 0 ? '#26a69a' : '#ef5350' };
                }
                return { time: d.time, value: NaN };
            }).filter(d => !isNaN(d.value as number));

            macdLineRef.current.setData(mLine);
            macdSignalRef.current!.setData(sLine);
            macdHistRef.current!.setData(hLine);
        } else if (macdLineRef.current) {
            chartRef.current.removeSeries(macdLineRef.current);
            if (macdSignalRef.current) chartRef.current.removeSeries(macdSignalRef.current);
            if (macdHistRef.current) chartRef.current.removeSeries(macdHistRef.current);
            macdLineRef.current = null; macdSignalRef.current = null; macdHistRef.current = null;
        }

    }, [activeIndicators]);

    // 3. Fetch Data when Symbol or Interval Changes
    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/chart?symbol=${symbol}&interval=${interval}`);
                const data = await res.json();

                if (res.ok && active && seriesRef.current && volumeRef.current) {
                    const cData = data.map((d: any) => ({
                        time: typeof d.time === 'number' ? d.time : d.time,
                        open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume
                    }));

                    if (cData.length > 0) {
                        lastCandleRef.current = { ...cData[cData.length - 1] };
                        setLivePrice(lastCandleRef.current.close);
                        rawDataRef.current = cData; // Store for indicators
                    }

                    const vData = cData.map((d: any) => ({
                        time: d.time, value: d.volume,
                        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
                    }));

                    seriesRef.current.setData(cData.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
                    volumeRef.current.setData(vData);

                    // Re-calculate indicators immediately on data load
                    computeIndicators(cData);

                    chartRef.current?.timeScale().fitContent();
                    chartRef.current?.timeScale().scrollToRealTime();
                } else if (data.error && active) {
                    setError(data.error);
                }
            } catch (err: any) {
                if (active) setError(err.message || "Failed to load chart data");
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => { active = false; };
    }, [symbol, interval, computeIndicators]);

    // Live update trigger (polling)
    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (isLive && symbol && ['1m', '5m', '15m', '30m', '1h', '1day'].includes(interval)) {
            timerId = setInterval(async () => {
                if (document.visibilityState !== 'visible') return;
                try {
                    const res = await fetch(`/api/market-data?symbols=${symbol}`);
                    const data = await res.json();
                    if (data && data[0] && data[0].price && lastCandleRef.current && seriesRef.current) {
                        const newPrice = data[0].price;
                        setLivePrice(newPrice);
                        lastCandleRef.current.close = newPrice;
                        lastCandleRef.current.high = Math.max(lastCandleRef.current.high, newPrice);
                        lastCandleRef.current.low = Math.min(lastCandleRef.current.low, newPrice);
                        seriesRef.current.update(lastCandleRef.current);

                        // We do not recompute ALL indicators on live ticks for performance reasons
                        // but price action will update realistically.
                    }
                } catch (e) {
                    console.error("Live chart update failed:", e);
                }
            }, 5000);
        }
        return () => clearInterval(timerId);
    }, [isLive, symbol, interval]);

    const handleSaveLayout = async () => {
        if (isCompareMode) return;
        setSaving(true);
        try {
            const layoutData: ChartLayoutData = {
                interval,
                indicators: activeIndicators
            };
            const res = await fetch('/api/layouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, layout_data: layoutData })
            });
            if (!res.ok) throw new Error("Failed to save layout");
            toast.success("Chart layout saved!");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleIndicator = (ind: string) => {
        setActiveIndicators(prev =>
            prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
        );
    };

    const timeframes = [
        { value: '1m', label: '1m' }, { value: '5m', label: '5m' },
        { value: '15m', label: '15m' }, { value: '30m', label: '30m' },
        { value: '1h', label: '1h' }, { value: '1day', label: '1D' },
        { value: '1week', label: '1W' }, { value: '1month', label: '1M' },
    ];

    const availableIndicators = ['RSI', 'MACD', 'EMA', 'SMA', 'BB', 'VWAP'];

    const clearDrawings = () => {
        if (seriesRef.current) {
            // Re-create the horizontal lines ref array if typing issues exist, we used 'any' in some versions but IPriceLine here
            horizontalLinesRef.current.forEach(line => seriesRef.current?.removePriceLine(line));
            horizontalLinesRef.current = [];
        }
        if (chartRef.current) {
            trendLinesRef.current.forEach(series => chartRef.current?.removeSeries(series));
            trendLinesRef.current = [];
        }
        tempTrendPointRef.current = null;
        setIsDrawingTrend(false);
        setDrawingMode('NONE');
        toast.info("Drawings cleared");
    };

    return (
        <div ref={rootContainerRef} className={`relative flex flex-col w-full h-full min-h-[500px] bg-card overflow-hidden ${className || ''}`}>
            {/* Header Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-background/80 backdrop-blur border-b border-border shadow-sm">

                {/* Left Side: Symbol & Timeframe & Indicators */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm px-2 hidden sm:block">{symbol}</span>
                    <div className="w-px h-4 bg-border hidden sm:block"></div>

                    {/* Timeframe Dropdown */}
                    <div className="relative">
                        <select
                            value={interval}
                            onChange={(e) => setIntervalState(e.target.value)}
                            className="appearance-none bg-muted text-foreground font-medium text-xs py-1.5 pl-3 pr-8 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-accent transition-colors"
                        >
                            {timeframes.map((tr) => (
                                <option key={tr.value} value={tr.value}>{tr.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                            <ChevronDown className="h-3 w-3" />
                        </div>
                    </div>

                    {/* Indicators Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
                            className="flex items-center gap-1.5 bg-muted hover:bg-accent text-foreground font-medium text-xs py-1.5 px-3 border border-border rounded transition-colors"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Indicators</span>
                        </button>

                        {showIndicatorsMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowIndicatorsMenu(false)}></div>
                                <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1 flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase px-4 py-1 tracking-wider">Overlays & Oscillators</span>
                                    {availableIndicators.map(ind => (
                                        <button
                                            key={ind}
                                            onClick={() => toggleIndicator(ind)}
                                            className="flex items-center justify-between px-4 py-2 hover:bg-muted text-sm text-left transition-colors"
                                        >
                                            <span>{ind}</span>
                                            {activeIndicators.includes(ind) && <Check className="w-4 h-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Live, Save, Fullscreen */}
                <div className="flex items-center gap-2">
                    {headerRightContent && (
                        <div className="hidden sm:block mr-1">
                            {headerRightContent}
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-2 bg-muted/50 rounded border border-border py-1">
                        {isLive && ['1m', '5m', '15m', '30m', '1h', '1day'].includes(interval) && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        )}
                        <span className="text-xs font-bold font-mono text-foreground min-w-[60px] text-right">
                            {livePrice ? `₹${livePrice.toFixed(2)}` : '...'}
                        </span>
                    </div>

                    {!isCompareMode && (
                        <button
                            onClick={handleSaveLayout}
                            disabled={saving}
                            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 p-1.5 rounded transition-colors hidden sm:flex items-center gap-1 px-3 text-xs font-medium"
                            title="Save Layout"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            <span>Save</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                rootContainerRef.current?.requestFullscreen().catch(() => { });
                            } else {
                                document.exitFullscreen();
                            }
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 border border-border rounded bg-muted hover:bg-accent"
                        title="Toggle Fullscreen"
                    >
                        <Maximize className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Error Overlay */}
            {error && !loading && (
                <div className="absolute inset-x-0 top-14 z-20 flex items-center justify-center p-4 py-8">
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col items-center border border-destructive/20 max-w-sm text-center backdrop-blur-md">
                        <span className="text-sm font-semibold mb-1">Chart Unavailable</span>
                        <span className="text-xs opacity-90">{error}</span>
                    </div>
                </div>
            )}

            {/* Drawing Toolbar (Left) */}
            {!isCompareMode && (
                <div className="absolute left-2 top-[60px] z-10 flex flex-col gap-1 bg-background/80 backdrop-blur border border-border rounded-lg shadow-sm p-1">
                    <button onClick={() => { setDrawingMode('NONE'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'NONE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Cursor"><MousePointer2 className="w-4 h-4" /></button>
                    <button onClick={() => { setDrawingMode(drawingMode === 'HLINE' ? 'NONE' : 'HLINE'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'HLINE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Horizontal Line"><Minus className="w-4 h-4" /></button>
                    <button onClick={() => { setDrawingMode(drawingMode === 'TREND' ? 'NONE' : 'TREND'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'TREND' || isDrawingTrend ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Trendline (Click 2 points)"><TrendingUp className="w-4 h-4" /></button>
                    {/* Clear Button */}
                    <div className="w-full h-px bg-border my-1"></div>
                    <button onClick={clearDrawings} className="p-2 rounded transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Clear all drawings"><Trash2 className="w-4 h-4" /></button>
                </div>
            )}

            {/* Main Chart Canvas Container */}
            <div ref={chartContainerRef} className={`flex-1 w-full relative z-0 mt-[45px] ${drawingMode !== 'NONE' ? '[&_canvas]:cursor-crosshair' : ''}`} />

            {/* Loading Overlay (Bottom Layer) */}
            {loading && (
                <div className="absolute inset-0 top-[45px] z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-sm font-medium text-foreground">Loading chart data...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
