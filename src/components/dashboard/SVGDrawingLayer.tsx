import React, { useEffect, useState, useRef } from 'react';
import { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import { Type, Square, Circle, ArrowUpRight, Minus, PaintBucket, Trash2, X } from 'lucide-react';

export type DrawingType = 'rect' | 'circle' | 'ray' | 'text' | 'arrow';

export interface Point {
    time: number;
    price: number;
}

export interface Drawing {
    id: string;
    type: DrawingType;
    p1: Point;
    p2?: Point;
    text?: string;
    color: string;
    thickness: number;
}

interface SVGDrawingLayerProps {
    chart: IChartApi | null;
    series: ISeriesApi<any> | null;
    drawings: Drawing[];
    onDrawingsChange: (drawings: Drawing[]) => void;
    activeMode: DrawingType | 'NONE';
    onModeChange: (mode: DrawingType | 'NONE') => void;
    width: number;
    height: number;
}

export function SVGDrawingLayer({
    chart,
    series,
    drawings,
    onDrawingsChange,
    activeMode,
    onModeChange,
    width,
    height
}: SVGDrawingLayerProps) {
    const [tempDrawing, setTempDrawing] = useState<Drawing | null>(null);
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const draggingStateRef = useRef<{ id: string, handle: 'p1' | 'p2' } | null>(null);
    const latestDrawingsRef = useRef(drawings);

    useEffect(() => {
        latestDrawingsRef.current = drawings;
    }, [drawings]);

    // Convert Time/Price to Pixel X/Y
    const toPixel = (point: Point) => {
        if (!chart || !series) return { x: -100, y: -100 };
        const ts = chart.timeScale();
        const x = ts.timeToCoordinate(point.time as any);
        const y = series.priceToCoordinate(point.price);
        return {
            x: x !== null ? x : -100,
            y: y !== null ? y : -100
        };
    };

    // Convert Pixel X/Y to Time/Price
    const fromPixel = (x: number, y: number): Point | null => {
        if (!chart || !series) return null;
        const ts = chart.timeScale();
        const time = ts.coordinateToTime(x as any);
        const price = series.coordinateToPrice(y);
        if (time === null || price === null) return null;
        return { time: time as number, price };
    };

    useEffect(() => {
        if (!chart) return;

        const handleCrosshairMove = (param: MouseEventParams) => {
            if (!param.point) return;
            const pt = fromPixel(param.point.x, param.point.y);
            if (!pt) return;

            if (activeMode !== 'NONE' && tempDrawing) {
                setTempDrawing({ ...tempDrawing, p2: pt });
            }

            const ds = draggingStateRef.current;
            if (ds) {
                onDrawingsChange(latestDrawingsRef.current.map(d => d.id === ds.id ? { ...d, [ds.handle]: pt } : d));
            }
        };

        const handleClick = (param: MouseEventParams) => {
            if (activeMode === 'NONE') {
                return;
            }

            if (!param.point) return;
            const pt = fromPixel(param.point.x, param.point.y);
            if (!pt) return;

            if (!tempDrawing) {
                const newDraw: Drawing = {
                    id: Math.random().toString(36).substring(2, 11),
                    type: activeMode,
                    p1: pt,
                    p2: pt,
                    color: '#2962FF',
                    thickness: 2,
                    text: activeMode === 'text' ? 'New Text' : undefined
                };
                setTempDrawing(newDraw);

                // If text, finish immediately
                if (activeMode === 'text') {
                    onDrawingsChange([...drawings, newDraw]);
                    setTempDrawing(null);
                    onModeChange('NONE');
                }
            } else {
                onDrawingsChange([...drawings, { ...tempDrawing, p2: pt }]);
                setTempDrawing(null);
                onModeChange('NONE');
            }
        };

        chart.subscribeClick(handleClick);
        chart.subscribeCrosshairMove(handleCrosshairMove);

        return () => {
            chart.unsubscribeClick(handleClick);
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
    }, [chart, activeMode, tempDrawing, drawings, onDrawingsChange, onModeChange]);

    // Force re-render on chart pan/zoom
    const [, forceRender] = useState({});
    useEffect(() => {
        if (!chart) return;
        const ts = chart.timeScale();
        const handler = () => forceRender({});
        ts.subscribeVisibleTimeRangeChange(handler);
        ts.subscribeVisibleLogicalRangeChange(handler);
        return () => {
            ts.unsubscribeVisibleTimeRangeChange(handler);
            ts.unsubscribeVisibleLogicalRangeChange(handler);
        };
    }, [chart]);

    const renderDrawing = (d: Drawing, isTemp = false) => {
        const p1 = toPixel(d.p1);
        const p2 = d.p2 ? toPixel(d.p2) : p1;

        // Hide if totally off screen (basic clipping)
        if (p1.x < -3000 && p2.x < -3000) return null;

        const isSelected = selectedDrawingId === d.id && !isTemp;
        const strokeColor = isSelected ? '#ffeb3b' : d.color;
        const strokeWidth = isSelected ? d.thickness + 2 : d.thickness;

        const onClick = (e: React.MouseEvent) => {
            if (activeMode !== 'NONE') return;
            e.stopPropagation();
            setSelectedDrawingId(isSelected ? null : d.id);
        };

        const renderHandles = () => {
            if (!isSelected) return null;
            const renderHandle = (p: { x: number, y: number }, handleType: 'p1' | 'p2') => (
                <circle
                    key={handleType} cx={p.x} cy={p.y} r={5}
                    fill="white" stroke="#2962FF" strokeWidth={2}
                    className="cursor-move hover:scale-125 transition-transform" style={{ pointerEvents: 'all' }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        // Also notify parent chart not to pan!
                        draggingStateRef.current = { id: d.id, handle: handleType };
                    }}
                />
            );
            return (
                <g>
                    {renderHandle(p1, 'p1')}
                    {d.p2 && renderHandle(p2, 'p2')}
                </g>
            );
        };

        const shape = (() => {
            switch (d.type) {
                case 'rect': {
                    const x = Math.min(p1.x, p2.x);
                    const y = Math.min(p1.y, p2.y);
                    const w = Math.abs(p2.x - p1.x);
                    const h = Math.abs(p2.y - p1.y);
                    return (
                        <rect
                            x={x} y={y} width={w} height={h}
                            fill={d.color + '33'} stroke={strokeColor} strokeWidth={strokeWidth}
                            onClick={onClick} className="cursor-pointer" style={{ pointerEvents: (isTemp || activeMode !== 'NONE') ? 'none' : 'all' }}
                        />
                    );
                }
                case 'circle': {
                    const r = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    return (
                        <circle
                            cx={p1.x} cy={p1.y} r={r}
                            fill={d.color + '33'} stroke={strokeColor} strokeWidth={strokeWidth}
                            onClick={onClick} className="cursor-pointer" style={{ pointerEvents: (isTemp || activeMode !== 'NONE') ? 'none' : 'all' }}
                        />
                    );
                }
                case 'ray': {
                    // Update: user requested finite line segment instead of infinite ray
                    return (
                        <line
                            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                            stroke={strokeColor} strokeWidth={strokeWidth}
                            onClick={onClick} className="cursor-pointer" style={{ pointerEvents: (isTemp || activeMode !== 'NONE') ? 'none' : 'stroke' }}
                        />
                    );
                }
                case 'arrow': {
                    const angleA = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const headLen = 15;
                    return (
                        <g onClick={onClick} className="cursor-pointer" style={{ pointerEvents: (isTemp || activeMode !== 'NONE') ? 'none' : 'stroke' }}>
                            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={strokeColor} strokeWidth={strokeWidth} />
                            <line
                                x1={p2.x} y1={p2.y}
                                x2={p2.x - headLen * Math.cos(angleA - Math.PI / 6)}
                                y2={p2.y - headLen * Math.sin(angleA - Math.PI / 6)}
                                stroke={strokeColor} strokeWidth={strokeWidth}
                            />
                            <line
                                x1={p2.x} y1={p2.y}
                                x2={p2.x - headLen * Math.cos(angleA + Math.PI / 6)}
                                y2={p2.y - headLen * Math.sin(angleA + Math.PI / 6)}
                                stroke={strokeColor} strokeWidth={strokeWidth}
                            />
                        </g>
                    );
                }
                case 'text': {
                    return (
                        <text
                            x={p1.x} y={p1.y}
                            fill={isSelected ? '#ffeb3b' : d.color}
                            fontSize={16} fontWeight="bold"
                            onClick={onClick} className="cursor-pointer" style={{ pointerEvents: (isTemp || activeMode !== 'NONE') ? 'none' : 'all' }}
                        >
                            {d.text}
                        </text>
                    );
                }
                default:
                    return null;
            }
        })();

        return (
            <g key={d.id}>
                {shape}
                {renderHandles()}
            </g>
        );
    };

    const updateSelected = (updates: Partial<Drawing>) => {
        if (!selectedDrawingId) return;
        onDrawingsChange(drawings.map(d => d.id === selectedDrawingId ? { ...d, ...updates } : d));
    };

    const deleteSelected = () => {
        if (!selectedDrawingId) return;
        onDrawingsChange(latestDrawingsRef.current.filter(d => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
    };

    useEffect(() => {
        const handlePointerUp = () => { draggingStateRef.current = null; };
        window.addEventListener('pointerup', handlePointerUp);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                if (selectedDrawingId) {
                    onDrawingsChange(latestDrawingsRef.current.filter(d => d.id !== selectedDrawingId));
                    setSelectedDrawingId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedDrawingId, onDrawingsChange]);

    return (
        <div className="absolute inset-0 pointer-events-none z-[100]" style={{ width, height }}>
            {/* The SVG element itself must pass through clicks unless hitting a child element */}
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="absolute inset-0 pointer-events-none"
            >
                {drawings.map(d => renderDrawing(d))}
                {tempDrawing && renderDrawing(tempDrawing, true)}
            </svg>

            {/* Floating Toolbar for Selected Drawing */}
            {selectedDrawingId && (
                <div
                    className="absolute z-[110] flex items-center gap-1 bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl p-1 animate-in fade-in zoom-in pointer-events-auto"
                    style={{ left: '50%', top: '20px', transform: 'translateX(-50%)' }}
                >
                    <div className="flex items-center gap-1 px-2 border-r border-border">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Edit</span>
                    </div>

                    {/* Colors */}
                    {['#2962FF', '#ef5350', '#26a69a', '#ffb74d', '#ffffff'].map(c => (
                        <button
                            key={c} onClick={() => updateSelected({ color: c })}
                            className="w-5 h-5 rounded-full border border-black/20"
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="w-px h-4 bg-border mx-1" />

                    {/* Thickness */}
                    {[1, 2, 4].map(t => (
                        <button
                            key={t} onClick={() => updateSelected({ thickness: t })}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted text-foreground"
                        >
                            <div className="bg-current w-3" style={{ height: t }} />
                        </button>
                    ))}

                    {/* Text Edit Mode */}
                    {drawings.find(d => d.id === selectedDrawingId)?.type === 'text' && (
                        <button
                            onClick={() => {
                                const newText = prompt('Enter new text:', drawings.find(d => d.id === selectedDrawingId)?.text);
                                if (newText) updateSelected({ text: newText });
                            }}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted text-foreground"
                            title="Edit Text"
                        >
                            <Type className="w-4 h-4" />
                        </button>
                    )}

                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                        onClick={deleteSelected}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10 text-destructive"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSelectedDrawingId(null)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted text-muted-foreground"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
