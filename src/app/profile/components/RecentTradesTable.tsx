'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, ChevronRight, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Trade {
    type: string;
    symbol: string;
    qty: number;
    avg_price: number;
    created_at: string;
    status: string;
    realized_pnl?: number | null;
}

export default function RecentTradesTable({ trades }: { trades: Trade[] }) {
    const [filter, setFilter] = useState<'ALL' | 'STOCKS' | 'OPTIONS'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    const isOptions = (sym: string) => /\d{5}(CE|PE)$/i.test(sym) || /FUT$/i.test(sym);

    const filteredTrades = trades.filter(t => {
        // Filter by Asset Class
        if (filter === 'STOCKS' && isOptions(t.symbol)) return false;
        if (filter === 'OPTIONS' && !isOptions(t.symbol)) return false;

        // Filter by Search (Symbol)
        if (searchQuery && !t.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Calculate approximate exit price if we have realized PNL
    const calculateExit = (t: Trade) => {
        if (!t.realized_pnl) return '-';
        if (t.qty === 0) return '-';

        // PNL = (Exit - Entry) * Qty for BUY
        // PNL = (Entry - Exit) * Qty for SELL
        if (t.type.toUpperCase() === 'BUY') {
            return formatCurrency(t.avg_price + (t.realized_pnl / t.qty));
        } else {
            return formatCurrency(t.avg_price - (t.realized_pnl / t.qty));
        }
    };

    return (
        <div className="bg-[#1E232F]/80 border border-gray-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
            {/* Table Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center p-5 border-b border-gray-800/60 bg-[#161B22]/50 gap-4">
                <div className="flex items-center gap-2">
                    <HistoryIcon />
                    <h2 className="text-lg font-bold text-white tracking-tight">Trade History</h2>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative w-full md:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0F172A] border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex bg-[#0F172A] p-1 rounded-lg border border-gray-800 w-full md:w-auto overflow-x-auto classic-scrollbar">
                        {['ALL', 'STOCKS', 'OPTIONS'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-[#2B313F] text-white shadow-sm border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-[#161B22]/80 text-gray-500 border-b border-gray-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Instrument</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold text-right">Qty</th>
                            <th className="px-6 py-4 font-semibold text-right">Entry</th>
                            <th className="px-6 py-4 font-semibold text-right hidden md:table-cell">Exit</th>
                            <th className="px-6 py-4 font-semibold text-right">P&L</th>
                            <th className="px-6 py-4 font-semibold text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.length > 0 ? (
                            filteredTrades.map((t, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedTrade(t)}
                                    className="border-b border-gray-800/50 hover:bg-[#2B313F]/40 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-gray-200">
                                        {t.symbol}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-sm ${t.type.toUpperCase() === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {t.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {t.qty}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        {formatCurrency(t.avg_price)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono hidden md:table-cell text-gray-500">
                                        {calculateExit(t)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold ${(t.realized_pnl || 0) > 0 ? 'text-emerald-400' : (t.realized_pnl || 0) < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {(t.realized_pnl || 0) > 0 ? '+' : ''}
                                        {t.realized_pnl ? formatCurrency(t.realized_pnl) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mx-auto">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    No trades found matching the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Quick Details Modal Overlay */}
            <AnimatePresence>
                {selectedTrade && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedTrade(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1E232F] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                            <div className="p-6 border-b border-gray-800 flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${selectedTrade.type.toUpperCase() === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {selectedTrade.type.toUpperCase()}
                                        </span>
                                        <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedTrade.created_at).toLocaleString('en-IN')}</span>
                                    </div>
                                    <h3 className="text-2xl font-black font-mono text-white tracking-tight">{selectedTrade.symbol}</h3>
                                </div>
                                <button onClick={() => setSelectedTrade(null)} className="p-2 text-gray-500 hover:text-white bg-gray-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="p-6 space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl">
                                        <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Entry Price</p>
                                        <p className="text-lg font-mono text-gray-200">{formatCurrency(selectedTrade.avg_price)}</p>
                                    </div>
                                    <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl">
                                        <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Exit Price</p>
                                        <p className="text-lg font-mono text-gray-200">{calculateExit(selectedTrade)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0F172A] border border-gray-800 rounded-xl">
                                    <div>
                                        <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Quantity</p>
                                        <p className="text-xl font-bold text-white">{selectedTrade.qty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Realized P&L</p>
                                        <p className={`text-2xl font-black font-mono flex items-center justify-end gap-2 ${(selectedTrade.realized_pnl || 0) > 0 ? 'text-emerald-400' : (selectedTrade.realized_pnl || 0) < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                            {(selectedTrade.realized_pnl || 0) > 0 ? <TrendingUp className="w-5 h-5" /> : (selectedTrade.realized_pnl || 0) < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                                            {(selectedTrade.realized_pnl || 0) > 0 ? '+' : ''}
                                            {selectedTrade.realized_pnl ? formatCurrency(selectedTrade.realized_pnl) : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function HistoryIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
