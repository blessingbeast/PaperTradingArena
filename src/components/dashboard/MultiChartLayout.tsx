'use client';

import React, { useState } from 'react';
import StockChart from './StockChart';
import { LayoutGrid, Layers, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockSearch } from './StockSearch';

interface MultiChartLayoutProps {
    symbol: string;
    interval?: string;
    onIntervalChange?: (interval: string) => void;
    mode?: LayoutMode;
    secondarySymbol?: string;
    onSecondarySymbolClear?: () => void;
    onSearchRequest?: () => void;
}

export type LayoutMode = 'SINGLE' | 'SPLIT' | 'COMPARE';

export function MultiChartLayout({ symbol, interval, onIntervalChange, mode = 'SINGLE', secondarySymbol = '', onSecondarySymbolClear, onSearchRequest }: MultiChartLayoutProps) {
    return (
        <div className="flex flex-col w-full h-full relative">
            {/* Layout Rendering */}
            <div className="flex-1 w-full h-full flex overflow-hidden">
                {mode === 'SINGLE' && (
                    <StockChart symbol={symbol} interval={interval} onIntervalChange={onIntervalChange} className="w-full h-full border-0" />
                )}

                {mode === 'SPLIT' && (
                    <div className="flex w-full h-full divide-x divide-border">
                        <div className="flex-1 h-full min-w-0">
                            <StockChart symbol={symbol} interval={interval} onIntervalChange={onIntervalChange} className="w-full h-full border-0" />
                        </div>
                        {secondarySymbol ? (
                            <div className="flex-1 h-full min-w-0 relative">
                                <button onClick={onSecondarySymbolClear} className="absolute z-20 top-2 right-2 p-1 bg-background/80 rounded border hover:bg-destructive hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <StockChart symbol={secondarySymbol} interval={interval} className="w-full h-full border-0" />
                            </div>
                        ) : (
                            <div className="flex-1 h-full min-w-0 flex items-center justify-center bg-muted/20">
                                <button onClick={onSearchRequest} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    <div className="p-3 bg-card rounded-full shadow-sm"><Search className="w-6 h-6" /></div>
                                    <span className="text-sm font-medium">Select Symbol</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'COMPARE' && (
                    <div className="w-full h-full relative">
                        {/* 
                          * In a true compare mode, the layout overlays two line series on a % scale.
                          * Since lightweight-charts makes combining external symbol datastreams into one chart complex without a centralized datafeed,
                          * we simulate Compare mode by rendering a secondary chart exactly on top with transparent backgrounds and synchronized timeframes! 
                        */}
                        <div className="absolute inset-0 z-0">
                            <StockChart symbol={symbol} interval={interval} onIntervalChange={onIntervalChange} className="w-full h-full border-0" />
                        </div>
                        {secondarySymbol && (
                            <div className="absolute inset-x-0 bottom-0 top-[45px] z-10 opacity-70 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
                                {/* We pass isCompareMode so the secondary chart hides toolbars and only renders price */}
                                <StockChart symbol={secondarySymbol} interval={interval} isCompareMode={true} className="w-full h-full border-0 !bg-transparent" />

                                <button onClick={onSecondarySymbolClear} className="absolute z-20 top-2 sm:top-[-40px] right-2 p-1 bg-background/80 rounded border pointer-events-auto hover:bg-destructive hover:text-white transition-colors hidden sm:flex items-center gap-1 text-xs px-2">
                                    <X className="w-3 h-3" /> Remove {secondarySymbol}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
