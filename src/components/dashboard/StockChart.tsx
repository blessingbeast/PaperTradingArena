'use client';

import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, MouseEventParams, IPriceLine } from 'lightweight-charts';
import { Loader2, ZoomIn, ZoomOut, ChevronDown, Maximize, Activity, Save, Check, MousePointer2, Minus, TrendingUp, Trash2, X, Square, Circle as CircleIcon, ArrowUpRight, ArrowRight, Type, PenTool, Settings } from 'lucide-react';
import { RSI, MACD, EMA, SMA, BollingerBands, VWAP } from 'technicalindicators';
import { SVGDrawingLayer, Drawing, DrawingType } from './SVGDrawingLayer';
import { DrawingsManager } from './DrawingsManager';
import { IndicatorSettingsModal, IndicatorSettings, defaultIndicatorSettings } from './IndicatorSettingsModal';
import { toast } from 'sonner';

function pointToLineSegmentDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    const C = x2 - x1;
    const D = y2 - y1;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = ((x - x1) * C + (y - y1) * D) / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

interface StockChartProps {
    symbol: string;
    className?: string;
    isCompareMode?: boolean;
    headerRightContent?: React.ReactNode;
    interval?: string;
    onIntervalChange?: (interval: string) => void;
}

interface ChartLayoutData {
    interval: string;
    indicators: string[];
    nativeDrawings?: {
        horizontal: { id: string, price: number }[];
        trend: { id: string, p1: any, p2: any }[];
    };
    svgDrawings?: Drawing[];
}

export default function StockChart({ symbol, className, isCompareMode = false, headerRightContent, interval: propInterval, onIntervalChange }: StockChartProps) {
    const rootContainerRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Core Series
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    // Dynamic Chart Dimensions for SVG
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

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
    const [localInterval, setLocalInterval] = useState('1day');
    const interval = propInterval || localInterval;
    const handleIntervalChange = (newInterval: string) => {
        setLocalInterval(newInterval);
        if (onIntervalChange) onIntervalChange(newInterval);
    };

    const [isLive, setIsLive] = useState(true);
    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);

    // Native Drawing Tools State (Trend & HLine)
    const [drawingMode, setDrawingModeState] = useState<'NONE' | 'HLINE' | 'TREND'>('NONE');
    const drawingModeRef = useRef<'NONE' | 'HLINE' | 'TREND'>('NONE');
    const setDrawingMode = (mode: 'NONE' | 'HLINE' | 'TREND') => {
        drawingModeRef.current = mode;
        setDrawingModeState(mode);
        if (mode !== 'NONE') setSvgDrawingMode('NONE'); // mutually exclusive
    };

    // SVG Drawing Tools State
    const [svgDrawings, setSvgDrawings] = useState<Drawing[]>([]);
    const [svgDrawingMode, setSvgDrawingMode] = useState<DrawingType | 'NONE'>('NONE');

    // Panel State
    const [showDrawingsPanel, setShowDrawingsPanel] = useState(false);
    // Force re-render for drawing count
    const [, setTick] = useState(0);

    // Indicator Config State
    const [indSettings, setIndSettings] = useState<IndicatorSettings>(defaultIndicatorSettings);
    const [activeConfigInd, setActiveConfigInd] = useState<keyof IndicatorSettings | null>(null);

    const handleSvgModeChange = (mode: DrawingType | 'NONE') => {
        setSvgDrawingMode(mode);
        if (mode !== 'NONE') setDrawingMode('NONE'); // mutually exclusive
    };

    const [isDrawingTrend, setIsDrawingTrendState] = useState(false);
    const isDrawingTrendRef = useRef(false);
    const setIsDrawingTrend = (val: boolean) => {
        isDrawingTrendRef.current = val;
        setIsDrawingTrendState(val);
    };

    const tempTrendPointRef = useRef<{ time: any, value: number } | null>(null);
    const trendLinesRef = useRef<{ id: string, series: ISeriesApi<"Line">, p1: any, p2: any }[]>([]);
    const horizontalLinesRef = useRef<{ id: string, line: IPriceLine, price: number }[]>([]);

    const [floatingDelete, setFloatingDelete] = useState<{ id: string; x: number; y: number; type: 'HLINE' | 'TREND' } | null>(null);
    const setFloatingDeleteRef = useRef<{ id: string; x: number; y: number; type: 'HLINE' | 'TREND' } | null>(null);
    const lastParamRef = useRef<MouseEventParams | null>(null);

    const lastCandleRef = useRef<any>(null);
    const rawDataRef = useRef<any[]>([]);

    const initialLayoutRef = useRef<any>(null);
    const nativeDrawingsAppliedRef = useRef(false);

    const applyNativeDrawings = useCallback(() => {
        if (!initialLayoutRef.current || !initialLayoutRef.current.nativeDrawings || nativeDrawingsAppliedRef.current) return;
        if (!chartRef.current || !seriesRef.current) return;

        const { horizontal = [], trend = [] } = initialLayoutRef.current.nativeDrawings;
        // Rehydrate horizontal lines
        for (const h of horizontal) {
            if (!horizontalLinesRef.current.find(l => l.id === h.id)) {
                try {
                    const pl = seriesRef.current.createPriceLine({ price: h.price, color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true });
                    horizontalLinesRef.current.push({ id: h.id, line: pl, price: h.price });
                } catch (e) { }
            }
        }
        // Rehydrate trend lines
        for (const t of trend) {
            if (!trendLinesRef.current.find(l => l.id === t.id)) {
                try {
                    const tlSeries = chartRef.current.addLineSeries({ color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
                    tlSeries.setData([t.p1, t.p2].sort((a: any, b: any) => a.time - b.time));
                    trendLinesRef.current.push({ id: t.id, series: tlSeries, p1: t.p1, p2: t.p2 });
                } catch (e) { }
            }
        }
        nativeDrawingsAppliedRef.current = true;
        setTick(t => t + 1);
    }, []);

    // 1. Fetch Layout from Server on Mount
    useEffect(() => {
        if (isCompareMode) return; // Don't load saved layout for secondary compare charts
        const fetchLayout = async () => {
            try {
                const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
                if (isDemo) {
                    initialLayoutRef.current = { interval: '5m', indicators: ['RSI'] };
                    handleIntervalChange('5m');
                    setActiveIndicators(['RSI']);
                    return;
                }
                const res = await fetch(`/api/layouts?symbol=${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && Object.keys(data).length > 0) {
                        initialLayoutRef.current = data;
                        if (data.interval) handleIntervalChange(data.interval);
                        if (data.indicators) setActiveIndicators(data.indicators);
                        if (data.svgDrawings) setSvgDrawings(data.svgDrawings);
                        setTimeout(applyNativeDrawings, 100);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch layout:", err);
            }
        };
        fetchLayout();
    }, [symbol, isCompareMode, applyNativeDrawings]);

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
            crosshair: { mode: 0 }, // 0 is Normal, 1 is Magnet
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

            const currentMode = drawingModeRef.current;

            // SELECTION LOGIC (Click to Select)
            if (currentMode === 'NONE' && !isDrawingTrendRef.current) {
                let foundHover = false;
                const threshold = 12; // pixels

                // Check Horizontal Lines
                for (const hline of horizontalLinesRef.current) {
                    const y = seriesRef.current.priceToCoordinate(hline.price);
                    if (y !== null && Math.abs(param.point.y - y) < threshold) {
                        const payload = { id: hline.id, x: param.point.x, y: Math.max(0, param.point.y), type: 'HLINE' as const };
                        setFloatingDelete(payload);
                        setFloatingDeleteRef.current = payload;
                        foundHover = true;
                        break;
                    }
                }

                // Check Trend Lines
                if (!foundHover) {
                    const ts = chart.timeScale();
                    for (const tline of trendLinesRef.current) {
                        const x1 = ts.timeToCoordinate(tline.p1.time);
                        const y1 = seriesRef.current?.priceToCoordinate(tline.p1.value) || null;
                        const x2 = ts.timeToCoordinate(tline.p2.time);
                        const y2 = seriesRef.current?.priceToCoordinate(tline.p2.value) || null;

                        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
                            const dist = pointToLineSegmentDistance(param.point.x, param.point.y, x1, y1, x2, y2);
                            if (dist < threshold) {
                                const payload = { id: tline.id, x: param.point.x, y: param.point.y, type: 'TREND' as const };
                                setFloatingDelete(payload);
                                setFloatingDeleteRef.current = payload;
                                foundHover = true;
                                break;
                            }
                        }
                    }
                }

                if (!foundHover) {
                    setFloatingDelete(null);
                    setFloatingDeleteRef.current = null;
                }
                return; // Stop processing creation logic if we are just selecting/deselecting
            }

            // CREATION LOGIC
            if (currentMode === 'HLINE') {
                const pl = seriesRef.current.createPriceLine({ price: price, color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true });
                if (pl) horizontalLinesRef.current.push({ id: Math.random().toString(36).substring(2, 9), line: pl, price });
                toast.success("Horizontal Line placed!");
                setDrawingMode('NONE');
                setTick(t => t + 1);
            }
            else if (currentMode === 'TREND') {
                if (!tempTrendPointRef.current) {
                    tempTrendPointRef.current = { time: param.time, value: price };
                    toast.info("Click again to end trendline");
                    setIsDrawingTrend(true);
                } else {
                    if (param.time === tempTrendPointRef.current.time) {
                        toast.error("Trendline points must be on different candles.");
                        return; // Stay in draw mode
                    }
                    const tlSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 2, lineStyle: LineStyle.Solid, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
                    const p1 = tempTrendPointRef.current;
                    const p2 = { time: param.time, value: price };
                    tlSeries.setData([p1, p2].sort((a, b) => (a.time as number) - (b.time as number)));
                    trendLinesRef.current.push({ id: Math.random().toString(36).substring(2, 9), series: tlSeries, p1, p2 });

                    tempTrendPointRef.current = null;
                    setIsDrawingTrend(false);
                    toast.success("Trendline placed!");
                    setDrawingMode('NONE');
                    setTick(t => t + 1);
                }
            }
        };
        chart.subscribeClick(handleChartClick);

        // Keep track of latest crosshair to move the float button if we drag the chart, etc.
        chart.subscribeCrosshairMove((param) => {
            lastParamRef.current = param;
        });

        // Resize handler using ResizeObserver which is safer
        const ro = new ResizeObserver((entries) => {
            if (entries.length === 0 || !chartRef.current) return;
            const newRect = entries[0].contentRect;
            if (newRect.width > 0 && newRect.height > 0) {
                try {
                    chartRef.current.applyOptions({ width: newRect.width, height: newRect.height });
                    setChartSize({ width: newRect.width, height: newRect.height });
                } catch (e) {
                    // Ignore disposition errors
                }
            }
        });

        if (chartContainerRef.current) {
            ro.observe(chartContainerRef.current);
            // Measure immediate
            try {
                const w = chartContainerRef.current.clientWidth;
                const h = chartContainerRef.current.clientHeight;
                chart.applyOptions({ width: w, height: h });
                setChartSize({ width: w, height: h });
            } catch (e) { }
        }
        let initialTimeout = setTimeout(applyNativeDrawings, 300);

        return () => {
            clearTimeout(initialTimeout);
            ro.disconnect();
            try { chart.unsubscribeClick(handleChartClick); } catch (e) { }
            try { chart.remove(); } catch (e) { }
            chartRef.current = null;
        };
    }, [applyNativeDrawings]);

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
            const cfg = indSettings.EMA;
            if (!emaRef.current) emaRef.current = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 2, title: `EMA (${cfg.period})` });
            else emaRef.current.applyOptions({ color: cfg.color, title: `EMA (${cfg.period})` });

            const emaValues = EMA.calculate({ period: cfg.period, values: closePrices });
            const paddedEma = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period - 1 ? emaValues[i - (cfg.period - 1)] : NaN })).filter(d => !isNaN(d.value));
            emaRef.current.setData(paddedEma);
        } else if (emaRef.current) {
            chartRef.current.removeSeries(emaRef.current);
            emaRef.current = null;
        }

        if (activeIndicators.includes('SMA')) {
            const cfg = indSettings.SMA;
            if (!smaRef.current) smaRef.current = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 2, title: `SMA (${cfg.period})` });
            else smaRef.current.applyOptions({ color: cfg.color, title: `SMA (${cfg.period})` });

            const smaValues = SMA.calculate({ period: cfg.period, values: closePrices });
            const paddedSma = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period - 1 ? smaValues[i - (cfg.period - 1)] : NaN })).filter(d => !isNaN(d.value));
            smaRef.current.setData(paddedSma);
        } else if (smaRef.current) {
            chartRef.current.removeSeries(smaRef.current);
            smaRef.current = null;
        }

        if (activeIndicators.includes('VWAP')) {
            const cfg = indSettings.VWAP;
            if (!vwapRef.current) vwapRef.current = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 2, title: 'VWAP' });
            else vwapRef.current.applyOptions({ color: cfg.color });

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
            const cfg = indSettings.BB;
            if (!bbUpperRef.current) {
                bbUpperRef.current = chartRef.current.addLineSeries({ color: cfg.color + '80', lineWidth: 1, title: 'BB Upper' });
                bbMiddleRef.current = chartRef.current.addLineSeries({ color: cfg.color, lineWidth: 1, title: 'BB Basis' });
                bbLowerRef.current = chartRef.current.addLineSeries({ color: cfg.color + '80', lineWidth: 1, title: 'BB Lower' });
            } else {
                bbUpperRef.current!.applyOptions({ color: cfg.color + '80' });
                bbMiddleRef.current!.applyOptions({ color: cfg.color });
                bbLowerRef.current!.applyOptions({ color: cfg.color + '80' });
            }

            const bbValues = BollingerBands.calculate({ period: cfg.period, stdDev: cfg.stdDev, values: closePrices });
            const up = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period - 1 ? bbValues[i - (cfg.period - 1)].upper : NaN })).filter(d => !isNaN(d.value));
            const mid = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period - 1 ? bbValues[i - (cfg.period - 1)].middle : NaN })).filter(d => !isNaN(d.value));
            const low = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period - 1 ? bbValues[i - (cfg.period - 1)].lower : NaN })).filter(d => !isNaN(d.value));
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
            const cfg = indSettings.RSI;
            if (!rsiPaneRef.current) {
                rsiPaneRef.current = chartRef.current.addLineSeries({
                    color: cfg.color, lineWidth: 2, title: `RSI (${cfg.period})`,
                    priceScaleId: 'rsi',
                });
                chartRef.current.priceScale('rsi').applyOptions({
                    scaleMargins: { top: bottomScaleStart, bottom: 0 },
                    borderColor: 'transparent',
                });
                bottomScaleStart -= 0.15; // Shift next pane up if needed
            } else {
                rsiPaneRef.current.applyOptions({ color: cfg.color, title: `RSI (${cfg.period})` });
            }
            const rsiValues = RSI.calculate({ period: cfg.period, values: closePrices });
            const paddedRsi = cData.map((d, i) => ({ time: d.time, value: i >= cfg.period ? rsiValues[i - cfg.period] : NaN })).filter(d => !isNaN(d.value));
            rsiPaneRef.current.setData(paddedRsi);
        } else if (rsiPaneRef.current) {
            chartRef.current.removeSeries(rsiPaneRef.current);
            rsiPaneRef.current = null;
        }

        if (activeIndicators.includes('MACD')) {
            const cfg = indSettings.MACD;
            if (!macdLineRef.current) {
                macdLineRef.current = chartRef.current.addLineSeries({ color: cfg.macdColor, lineWidth: 2, title: 'MACD', priceScaleId: 'macd' });
                macdSignalRef.current = chartRef.current.addLineSeries({ color: cfg.signalColor, lineWidth: 2, title: 'Signal', priceScaleId: 'macd' });
                macdHistRef.current = chartRef.current.addHistogramSeries({ priceScaleId: 'macd' });
                chartRef.current.priceScale('macd').applyOptions({
                    scaleMargins: { top: bottomScaleStart, bottom: 0 },
                    borderColor: 'transparent',
                });
            } else {
                macdLineRef.current.applyOptions({ color: cfg.macdColor });
                macdSignalRef.current!.applyOptions({ color: cfg.signalColor });
            }

            const macdValues = MACD.calculate({ values: closePrices, fastPeriod: cfg.fastPeriod, slowPeriod: cfg.slowPeriod, signalPeriod: cfg.signalPeriod, SimpleMAOscillator: false, SimpleMASignal: false });
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

        // Keep track of the previous symbol to clear drawings when it changes
        let isSymbolChange = false;
        if (chartRef.current && (chartRef.current as any)._lastSymbol !== symbol) {
            isSymbolChange = true;
            (chartRef.current as any)._lastSymbol = symbol;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // Clear drawings if symbol changed
            if (isSymbolChange) {
                if (seriesRef.current) {
                    horizontalLinesRef.current.forEach(lineObj => { try { seriesRef.current?.removePriceLine(lineObj.line) } catch (e) { } });
                    horizontalLinesRef.current = [];
                }
                if (chartRef.current) {
                    trendLinesRef.current.forEach(sObj => { try { chartRef.current?.removeSeries(sObj.series) } catch (e) { } });
                    trendLinesRef.current = [];
                }
                tempTrendPointRef.current = null;
                setIsDrawingTrend(false);
                setDrawingMode('NONE');
                setFloatingDelete(null);
                setSvgDrawings([]);
                setSvgDrawingMode('NONE');
                setTick(t => t + 1);
            }

            try {
                const res = await fetch(`/api/chart?symbol=${symbol}&interval=${interval}`);
                if (!active) return;

                // Read text first to prevent JSON parse errors crashing Next.js if API throws HTML
                const rawText = await res.text();
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (e) {
                    if (active) setError("Invalid response format from chart API");
                    return;
                }

                if (res.ok && active && chartRef.current && seriesRef.current && volumeRef.current) {
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

                    try {
                        seriesRef.current.setData(cData.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
                        volumeRef.current.setData(vData);

                        // Re-calculate indicators immediately on data load
                        computeIndicators(cData);

                        chartRef.current?.timeScale().fitContent();
                        chartRef.current?.timeScale().scrollToRealTime();

                        // Force price scale to autoScale after setting new data
                        chartRef.current?.priceScale('right').applyOptions({
                            autoScale: true,
                        });
                    } catch (err: any) {
                        // Suppress injection errors into disposed charts
                    }
                } else if (data.error && active) {
                    setError(data.error);
                }
            } catch (err: any) {
                if (active) setError(err.message || "Failed to load chart data");
                console.error("StockChart fetch error:", err);
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
                    if (data && data[0] && data[0].price && lastCandleRef.current && seriesRef.current && chartRef.current) {
                        const newPrice = data[0].price;
                        setLivePrice(newPrice);
                        lastCandleRef.current.close = newPrice;
                        lastCandleRef.current.high = Math.max(lastCandleRef.current.high, newPrice);
                        lastCandleRef.current.low = Math.min(lastCandleRef.current.low, newPrice);
                        try {
                            seriesRef.current.update(lastCandleRef.current);
                        } catch (e) {
                            // Ignored if chart was unmounted between checks
                        }
                    }

                    // We do not recompute ALL indicators on live ticks for performance reasons
                    // but price action will update realistically.
                } catch (e) {
                    console.error("Live chart update failed:", e);
                }
            }, 5000);
        }
        return () => clearInterval(timerId);
    }, [isLive, symbol, interval]);

    const handleSaveLayout = async () => {
        if (isCompareMode) return;
        const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
        if (isDemo) {
            toast.success("Demo layout saved locally!");
            return;
        }

        setSaving(true);
        try {
            const layoutData: ChartLayoutData = {
                interval,
                indicators: activeIndicators,
                svgDrawings,
                nativeDrawings: {
                    horizontal: horizontalLinesRef.current.map(l => ({ id: l.id, price: l.price })),
                    trend: trendLinesRef.current.map(t => ({ id: t.id, p1: t.p1, p2: t.p2 }))
                }
            };
            const res = await fetch('/api/layouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, layout_data: layoutData })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save layout");
            }
            toast.success("Chart layout saved!");
        } catch (e: any) {
            console.error(e);
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
            horizontalLinesRef.current.forEach(lineObj => { try { seriesRef.current?.removePriceLine(lineObj.line) } catch (e) { } });
            horizontalLinesRef.current = [];
        }
        if (chartRef.current) {
            trendLinesRef.current.forEach(sObj => chartRef.current?.removeSeries(sObj.series));
            trendLinesRef.current = [];
        }
        tempTrendPointRef.current = null;
        setIsDrawingTrend(false);
        setDrawingMode('NONE');
        setFloatingDelete(null);
        setSvgDrawings([]);
        setSvgDrawingMode('NONE');
        setTick(t => t + 1);
        toast.info("Drawings cleared");
    };

    const deleteDrawing = useCallback((id: string, type: 'HLINE' | 'TREND') => {
        if (type === 'HLINE' && seriesRef.current) {
            const idx = horizontalLinesRef.current.findIndex(l => l.id === id);
            if (idx > -1) {
                try { seriesRef.current.removePriceLine(horizontalLinesRef.current[idx].line); } catch (e) { }
                horizontalLinesRef.current.splice(idx, 1);
            }
        } else if (type === 'TREND' && chartRef.current) {
            const idx = trendLinesRef.current.findIndex(l => l.id === id);
            if (idx > -1) {
                try { chartRef.current.removeSeries(trendLinesRef.current[idx].series); } catch (e) { }
                trendLinesRef.current.splice(idx, 1);
            }
        }
        setFloatingDelete(null);
        setFloatingDeleteRef.current = null;
        setTick(t => t + 1);
    }, []);

    // Global Keyboard Delete Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                const fd = setFloatingDeleteRef.current;
                if (fd) {
                    deleteDrawing(fd.id, fd.type);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteDrawing]);

    const deleteSvgDrawing = useCallback((id: string) => {
        setSvgDrawings(prev => prev.filter(d => d.id !== id));
    }, []);

    const totalDrawings = horizontalLinesRef.current.length + trendLinesRef.current.length + svgDrawings.length;

    return (
        <div ref={rootContainerRef} className={`relative flex flex-col w-full h-full min-h-[500px] bg-card overflow-hidden ${className || ''}`}>
            {/* Header Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-background/80 backdrop-blur border-b border-border shadow-sm">

                {/* Left Side: Symbol & Timeframe & Indicators */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm px-2 hidden sm:block">{symbol}</span>
                    <div className="w-px h-4 bg-border hidden sm:block"></div>

                    {/* Timeframe Dropdown */}
                    <div className="relative tour-timeframe">
                        <select
                            value={interval}
                            onChange={(e) => handleIntervalChange(e.target.value)}
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
                    <div className="relative tour-indicators">
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
                        <>
                            <button
                                onClick={() => setShowDrawingsPanel(true)}
                                className="bg-muted hover:bg-accent text-foreground border border-border p-1.5 rounded transition-colors hidden sm:flex items-center gap-1.5 px-3 text-xs font-medium"
                                title="Manage Drawings"
                            >
                                <PenTool className="h-3.5 w-3.5" />
                                <span>Drawings</span>
                                {totalDrawings > 0 && (
                                    <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold">
                                        {totalDrawings}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleSaveLayout}
                                disabled={saving}
                                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 p-1.5 rounded transition-colors hidden sm:flex items-center gap-1 px-3 text-xs font-medium"
                                title="Save Layout"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                <span>Save</span>
                            </button>
                        </>
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

            {/* Drawings Side Panel */}
            <DrawingsManager
                symbol={symbol}
                isOpen={showDrawingsPanel}
                onClose={() => setShowDrawingsPanel(false)}
                horizontalLines={horizontalLinesRef.current}
                trendLines={trendLinesRef.current}
                onDeleteNative={deleteDrawing}
                svgDrawings={svgDrawings}
                onDeleteSvg={deleteSvgDrawing}
                onClearAll={clearDrawings}
            />

            {/* Drawing Toolbar (Left) */}
            {!isCompareMode && (
                <div className="absolute left-2 top-[60px] z-10 flex flex-col gap-1 bg-background/80 backdrop-blur border border-border rounded-lg shadow-sm p-1">
                    <button onClick={() => { setDrawingMode('NONE'); handleSvgModeChange('NONE'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'NONE' && svgDrawingMode === 'NONE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Cursor"><MousePointer2 className="w-4 h-4" /></button>

                    <div className="w-full h-px bg-border/50 my-0.5" />
                    <div className="text-[9px] uppercase font-bold text-muted-foreground/70 text-center scale-75">Lines</div>
                    <button onClick={() => { setDrawingMode(drawingMode === 'HLINE' ? 'NONE' : 'HLINE'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'HLINE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Horizontal Line"><Minus className="w-4 h-4" /></button>
                    <button onClick={() => { setDrawingMode(drawingMode === 'TREND' ? 'NONE' : 'TREND'); tempTrendPointRef.current = null; setIsDrawingTrend(false); }} className={`p-2 rounded transition-colors ${drawingMode === 'TREND' || isDrawingTrend ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Trendline (Click 2 points)"><TrendingUp className="w-4 h-4" /></button>
                    <button onClick={() => handleSvgModeChange(svgDrawingMode === 'ray' ? 'NONE' : 'ray')} className={`p-2 rounded transition-colors ${svgDrawingMode === 'ray' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Ray Line"><ArrowUpRight className="w-4 h-4" /></button>
                    <button onClick={() => handleSvgModeChange(svgDrawingMode === 'arrow' ? 'NONE' : 'arrow')} className={`p-2 rounded transition-colors ${svgDrawingMode === 'arrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Arrow"><ArrowRight className="w-4 h-4" /></button>

                    <div className="w-full h-px bg-border/50 my-0.5" />
                    <div className="text-[9px] uppercase font-bold text-muted-foreground/70 text-center scale-75">Shapes</div>
                    <button onClick={() => handleSvgModeChange(svgDrawingMode === 'rect' ? 'NONE' : 'rect')} className={`p-2 rounded transition-colors ${svgDrawingMode === 'rect' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Rectangle"><Square className="w-4 h-4" /></button>
                    <button onClick={() => handleSvgModeChange(svgDrawingMode === 'circle' ? 'NONE' : 'circle')} className={`p-2 rounded transition-colors ${svgDrawingMode === 'circle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Circle"><CircleIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleSvgModeChange(svgDrawingMode === 'text' ? 'NONE' : 'text')} className={`p-2 rounded transition-colors ${svgDrawingMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} title="Text Label"><Type className="w-4 h-4" /></button>

                    {/* Clear Button */}
                    <div className="w-full h-px bg-border/50 my-1"></div>
                    <button onClick={clearDrawings} className="p-2 rounded transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Clear all drawings"><Trash2 className="w-4 h-4" /></button>
                </div>
            )}

            {/* Active Indicators Legend */}
            {activeIndicators.length > 0 && (
                <div className="absolute top-[60px] left-[60px] z-10 flex flex-wrap gap-2 pointer-events-none pr-4">
                    {activeIndicators.map(ind => (
                        <div key={ind} className="bg-background/90 backdrop-blur border border-border px-2 py-1 flex items-center gap-1.5 shadow-sm rounded-md pointer-events-auto group">
                            <span className="text-[11px] font-bold tracking-wider text-primary">{ind}</span>
                            <div className="flex items-center gap-0.5 ml-1">
                                <button onClick={(e) => { e.stopPropagation(); setActiveConfigInd(ind as keyof IndicatorSettings); }} className="text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded p-1 transition-colors" title={`Configure ${ind}`}>
                                    <Settings className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleIndicator(ind); }} className="text-muted-foreground hover:text-destructive bg-muted/50 hover:bg-destructive/10 rounded p-1 transition-colors" title={`Remove ${ind}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Indicator Config Modal */}
            {activeConfigInd && (
                <IndicatorSettingsModal
                    indicator={activeConfigInd}
                    currentSettings={indSettings[activeConfigInd]}
                    onSave={(ind, newSet) => {
                        setIndSettings(prev => ({ ...prev, [ind]: newSet }));
                        // Force recalculation of everything
                        requestAnimationFrame(() => {
                            if (rawDataRef.current.length) {
                                computeIndicators(rawDataRef.current);
                            }
                        });
                    }}
                    onClose={() => setActiveConfigInd(null)}
                />
            )}

            {/* Main Chart Canvas Container */}
            <div ref={chartContainerRef} className={`flex-1 w-full relative z-0 mt-[45px] ${drawingMode !== 'NONE' || svgDrawingMode !== 'NONE' ? '[&_canvas]:cursor-crosshair' : ''}`}>
                {/* SVG Overlay Layer for Advanced Drawings */}
                <SVGDrawingLayer
                    chart={chartRef.current}
                    series={seriesRef.current}
                    drawings={svgDrawings}
                    onDrawingsChange={setSvgDrawings}
                    activeMode={svgDrawingMode}
                    onModeChange={handleSvgModeChange}
                    width={chartSize.width}
                    height={chartSize.height}
                />

                {/* Floating Delete Button for Native Drawings */}
                {floatingDelete && (
                    <button
                        className="absolute z-[110] flex items-center justify-center w-7 h-7 bg-background border border-destructive/30 hover:bg-destructive text-destructive hover:text-white rounded-full shadow-lg pointer-events-auto transition-all animate-in fade-in zoom-in cursor-pointer"
                        style={{ left: Math.max(0, floatingDelete.x - 14) + 'px', top: Math.max(0, floatingDelete.y - 30) + 'px' }}
                        onClick={(e) => { e.stopPropagation(); deleteDrawing(floatingDelete.id, floatingDelete.type); }}
                        title="Delete Native Drawing"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

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
