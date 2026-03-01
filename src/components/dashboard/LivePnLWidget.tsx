"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { cn } from "@/lib/utils";
import { PositionModifyDialog } from "./PositionModifyDialog";

export function LivePnLWidget({ symbol, currentPrice = 0 }: { symbol: string, currentPrice?: number }) {
    const { holdings } = usePortfolio();
    const position = holdings?.find(h => h.symbol === symbol);

    if (!position) return null;

    const isShort = position.qty < 0;
    const absQty = Math.abs(position.qty);
    const closeAction = isShort ? 'buy' : 'sell';

    const livePnL = currentPrice > 0
        ? (isShort ? (position.avg_price - currentPrice) * absQty : (currentPrice - position.avg_price) * absQty)
        : (position.pnl || 0);
    const isProfit = livePnL >= 0;
    const pnlPercent = (livePnL / (position.avg_price * absQty)) * 100;

    return (
        <div className={cn(
            "flex flex-wrap items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 gap-3 text-white",
            isProfit ? "bg-[#16A34A]" : "bg-[#DC2626]"
        )}>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Badge & Qty */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {isShort ? (
                            <span className="text-[10px] font-bold tracking-wider text-white bg-[#DC2626] px-2 py-0.5 rounded shadow-sm border border-white/20">SHORT</span>
                        ) : (
                            <span className="text-[10px] font-bold tracking-wider text-white bg-white/20 px-2 py-0.5 rounded shadow-sm">LONG</span>
                        )}
                        <span className="font-mono font-extrabold text-base sm:text-lg leading-none">{absQty}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-white/80 uppercase font-semibold tracking-wider">Active Position</span>
                </div>

                {/* Prices */}
                <div className="flex items-center gap-3 sm:gap-4 border-l pl-4 border-white/20">
                    <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] text-white/80 uppercase font-semibold tracking-wider mb-0.5">Avg Price</span>
                        <span className="font-mono font-medium text-xs sm:text-sm">₹{Number(position.avg_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] text-white/80 uppercase font-semibold tracking-wider mb-0.5">LTP</span>
                        <span className="font-mono font-bold text-xs sm:text-sm">₹{currentPrice > 0 ? currentPrice.toFixed(2) : '--'}</span>
                    </div>
                </div>
            </div>

            {/* PnL & Action */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1 sm:mt-0 ml-auto sm:ml-0">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] sm:text-[10px] text-white/80 uppercase font-semibold tracking-wider mb-0.5 border-b border-transparent">Real-time P&L</span>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono font-bold text-lg sm:text-xl tracking-tight leading-none">
                            {isProfit ? '+' : ''}₹{livePnL.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded-sm shadow-sm">
                            {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Modify Button: Opens Dialog for SL/Target */}
                    <PositionModifyDialog
                        symbol={symbol}
                        qty={position.qty}
                        avgPrice={position.avg_price}
                        currentLtp={currentPrice}
                        isShort={isShort}
                    />

                    {/* Exit Button redirects to the order panel pre-filled with the opposing action */}
                    <a href={`?symbol=${symbol}&action=${closeAction}`} className="shrink-0 group/exit">
                        <button className="bg-white hover:bg-white/90 shadow-sm text-black text-xs font-bold p-2 sm:p-2.5 rounded transition-all duration-300 flex items-center justify-center h-[34px] sm:h-[38px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black shrink-0"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            <span className="max-w-0 opacity-0 group-hover/exit:max-w-[40px] group-hover/exit:opacity-100 group-hover/exit:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Exit</span>
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
}
