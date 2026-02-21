'use client';

import React, { useState } from 'react';
import StockChart from './StockChart';
import { LayoutGrid, Layers, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockSearch } from './StockSearch';

interface MultiChartLayoutProps {
    symbol: string;
}

type LayoutMode = 'SINGLE' | 'SPLIT' | 'COMPARE';

export function MultiChartLayout({ symbol }: MultiChartLayoutProps) {
    const [mode, setMode] = useState<LayoutMode>('SINGLE');
    const [secondarySymbol, setSecondarySymbol] = useState<string>('');
    const [showSearch, setShowSearch] = useState(false);

    const handleCompareSelect = (sel: string) => {
        setSecondarySymbol(sel);
        setShowSearch(false);
    };

    const layoutToolbar = (
        <div className="flex items-center gap-1 bg-muted/50 rounded border border-border p-0.5 sm:p-1">
            <button
                onClick={() => { setMode('SINGLE'); setSecondarySymbol(''); setShowSearch(false); }}
                className={cn("p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1", mode === 'SINGLE' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
                title="Single Chart"
            >
                <div className="w-3 h-3 border-2 border-current rounded-sm"></div>
            </button>
            <button
                onClick={() => { setMode('SPLIT'); if (!secondarySymbol) setShowSearch(true); }}
                className={cn("p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1", mode === 'SPLIT' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
                title="Split Chart (Side by Side)"
            >
                <div className="flex gap-0.5"><div className="w-1.5 h-3 border-2 border-current rounded-sm"></div><div className="w-1.5 h-3 border-2 border-current rounded-sm"></div></div>
            </button>
            <div className="w-px h-4 bg-border mx-1 hidden sm:block"></div>
            <div className="relative">
                <button
                    onClick={() => {
                        if (mode === 'COMPARE') { setMode('SINGLE'); setSecondarySymbol(''); }
                        else { setMode('COMPARE'); if (!secondarySymbol) setShowSearch(true); }
                    }}
                    className={cn("p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1", mode === 'COMPARE' ? 'bg-blue-600 text-white' : 'hover:bg-muted text-muted-foreground')}
                    title="Compare (Overlay Chart)"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Compare</span>
                </button>

                {showSearch && (
                    <div className="absolute top-full mt-2 right-0 w-[250px] bg-background border border-border rounded-lg shadow-xl p-2 z-[150]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">Select Symbol to {mode === 'COMPARE' ? 'Compare' : 'Split'}</span>
                            <button onClick={() => setShowSearch(false)}><X className="w-3 h-3 text-muted-foreground" /></button>
                        </div>
                        <StockSearch onSelect={handleCompareSelect} placeholder="Search symbol..." />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col w-full h-full relative">
            {/* Layout Rendering */}
            <div className="flex-1 w-full h-full flex overflow-hidden">
                {mode === 'SINGLE' && (
                    <StockChart symbol={symbol} className="w-full h-full border-0" headerRightContent={layoutToolbar} />
                )}

                {mode === 'SPLIT' && (
                    <div className="flex w-full h-full divide-x divide-border">
                        <div className="flex-1 h-full min-w-0">
                            <StockChart symbol={symbol} className="w-full h-full border-0" headerRightContent={layoutToolbar} />
                        </div>
                        {secondarySymbol ? (
                            <div className="flex-1 h-full min-w-0 relative">
                                <button onClick={() => { setMode('SINGLE'); setSecondarySymbol(''); }} className="absolute z-20 top-2 right-2 p-1 bg-background/80 rounded border hover:bg-destructive hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <StockChart symbol={secondarySymbol} className="w-full h-full border-0" />
                            </div>
                        ) : (
                            <div className="flex-1 h-full min-w-0 flex items-center justify-center bg-muted/20">
                                <button onClick={() => setShowSearch(true)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
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
                            <StockChart symbol={symbol} className="w-full h-full border-0" headerRightContent={layoutToolbar} />
                        </div>
                        {secondarySymbol && (
                            <div className="absolute inset-x-0 bottom-0 top-[45px] z-10 opacity-70 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
                                {/* We pass isCompareMode so the secondary chart hides toolbars and only renders price */}
                                <StockChart symbol={secondarySymbol} isCompareMode={true} className="w-full h-full border-0 !bg-transparent" />

                                <button onClick={() => { setMode('SINGLE'); setSecondarySymbol(''); }} className="absolute z-20 top-2 sm:top-[-40px] right-2 p-1 bg-background/80 rounded border pointer-events-auto hover:bg-destructive hover:text-white transition-colors hidden sm:flex items-center gap-1 text-xs px-2">
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
