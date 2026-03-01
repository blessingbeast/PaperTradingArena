import React from 'react';
import { Trash2, PenTool, Minus, TrendingUp, Square, Circle, ArrowUpRight, ArrowRight, Type, X } from 'lucide-react';
import { Drawing } from './SVGDrawingLayer';
import { IPriceLine, ISeriesApi } from 'lightweight-charts';

interface DrawingsManagerProps {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
    // Native Drawings
    horizontalLines: { id: string, line: IPriceLine, price: number }[];
    trendLines: { id: string, series: ISeriesApi<"Line">, p1: any, p2: any }[];
    onDeleteNative: (id: string, type: 'HLINE' | 'TREND') => void;
    // SVG Drawings
    svgDrawings: Drawing[];
    onDeleteSvg: (id: string) => void;
    // Global Clear
    onClearAll: () => void;
}

export function DrawingsManager({
    symbol,
    isOpen,
    onClose,
    horizontalLines,
    trendLines,
    onDeleteNative,
    svgDrawings,
    onDeleteSvg,
    onClearAll
}: DrawingsManagerProps) {
    if (!isOpen) return null;

    const totalDrawings = horizontalLines.length + trendLines.length + svgDrawings.length;

    const getIconForType = (type: string) => {
        switch (type) {
            case 'HLINE': return <Minus className="w-4 h-4 text-blue-500" />;
            case 'TREND': return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case 'rect': return <Square className="w-4 h-4 text-purple-500" />;
            case 'circle': return <Circle className="w-4 h-4 text-purple-500" />;
            case 'ray': return <ArrowUpRight className="w-4 h-4 text-purple-500" />;
            case 'arrow': return <ArrowRight className="w-4 h-4 text-purple-500" />;
            case 'text': return <Type className="w-4 h-4 text-green-500" />;
            default: return <PenTool className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getLabelForType = (type: string) => {
        switch (type) {
            case 'HLINE': return 'Horizontal Line';
            case 'TREND': return 'Trend Line';
            case 'rect': return 'Rectangle';
            case 'circle': return 'Circle';
            case 'ray': return 'Ray Line';
            case 'arrow': return 'Arrow';
            case 'text': return 'Text Label';
            default: return 'Drawing';
        }
    };

    return (
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold">My Drawings</span>
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{totalDrawings}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-2">
                {totalDrawings === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground opacity-70">
                        <PenTool className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs font-medium">No drawings for <br /> {symbol}</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {/* Native Drawings */}
                        {horizontalLines.map(line => (
                            <div key={line.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-2">
                                    {getIconForType('HLINE')}
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium">{getLabelForType('HLINE')}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">₹{line.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteNative(line.id, 'HLINE')} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {trendLines.map(line => (
                            <div key={line.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-2">
                                    {getIconForType('TREND')}
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium">{getLabelForType('TREND')}</span>
                                        <span className="text-[10px] text-muted-foreground">Line span</span>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteNative(line.id, 'TREND')} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {/* SVG Drawings */}
                        {svgDrawings.map(draw => (
                            <div key={draw.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-2">
                                    {getIconForType(draw.type)}
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium">{getLabelForType(draw.type)}</span>
                                        {draw.type === 'text' && draw.text && (
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">"{draw.text}"</span>
                                        )}
                                        {draw.type !== 'text' && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <div className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: draw.color }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteSvg(draw.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {totalDrawings > 0 && (
                <div className="p-3 border-t border-border bg-muted/20">
                    <button
                        onClick={onClearAll}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded text-xs font-bold transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All Drawings
                    </button>
                </div>
            )}
        </div>
    );
}
