
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import stocksData from '@/data/stocks.json';

interface Stock {
    symbol: string;
    name: string;
    exchange: string;
    sector?: string;
}

interface StockSearchProps {
    onSelect: (symbol: string) => void;
    placeholder?: string;
    className?: string;
}

// Helper to generate a consistent color based on a string
const stringToColour = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777215)).toString(16);
    return '#' + '000000'.substring(0, 6 - color.length) + color;
};

export function StockSearch({ onSelect, placeholder = "Search stocks (e.g. RELIANCE, TCS)...", className = "" }: StockSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Stock[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.length > 0) {
            const filtered = (stocksData as Stock[]).filter(stock =>
                stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
                stock.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 8);
            setResults(filtered);
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global shortcut '/' to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (stock: Stock) => {
        onSelect(stock.symbol);
        setQuery('');
        setIsOpen(false);
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return <span>{text}</span>;
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <span key={i} className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold">{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    return (
        <div className={`relative tour-search ${className}`} ref={containerRef}>
            <div className="relative group/input">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full bg-background border border-border rounded-md pl-9 pr-16 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground/70"
                />

                {/* Keyboard Shortcut Hint or Clear Button */}
                {!query ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 border border-border rounded bg-muted text-[10px] font-mono text-muted-foreground font-medium">
                            /
                        </kbd>
                    </div>
                ) : (
                    <button
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-full p-0.5 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-[calc(100%+80px)] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {results.length > 0 ? (
                        <div className="py-1">
                            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30 border-b border-border">Symbol Search</div>
                            {results.map((stock) => {
                                const initial = stock.symbol.charAt(0);
                                const logoColor = stringToColour(stock.symbol);

                                return (
                                    <button
                                        key={stock.symbol}
                                        onClick={() => handleSelect(stock)}
                                        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            {/* Logo Placeholder */}
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-black/10 dark:border-white/10 shrink-0"
                                                style={{ backgroundColor: `${logoColor}20`, color: logoColor }}
                                            >
                                                <span className="font-bold text-xs">{initial}</span>
                                            </div>

                                            <div className="flex flex-col truncate">
                                                <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                                                    {highlightText(stock.symbol, query)}
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground uppercase font-medium border border-border/50">NSE</span>
                                                    {stock.sector && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 uppercase font-medium">{stock.sector}</span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                                                    {highlightText(stock.name, query)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Side Hover State */}
                                        <div className="hidden group-hover:flex items-center gap-1.5 shrink-0 ml-2">
                                            <div className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded transition-all tracking-wider flex items-center gap-1">
                                                <span>Add</span>
                                            </div>
                                        </div>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground/30 group-hover:hidden transition-colors shrink-0 ml-2" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                <Search className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No results found for "{query}"</p>
                            <p className="text-xs text-gray-500 mt-1">Try searching for a company name or symbol.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
