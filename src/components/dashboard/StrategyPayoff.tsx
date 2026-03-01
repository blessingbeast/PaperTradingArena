'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BasketItem {
    id: string;
    symbol: string;
    type: 'CE' | 'PE';
    strike: number;
    action: 'BUY' | 'SELL';
    price: number;
    qty: number;
}

interface StrategyPayoffProps {
    basket: BasketItem[];
    currentSpot: number;
    lotSize: number;
}

export function StrategyPayoff({ basket, currentSpot, lotSize }: StrategyPayoffProps) {
    
    // Generate Payoff Data Points
    const payoffData = useMemo(() => {
        if (basket.length === 0) return { data: [], maxLoss: 0, maxProfit: 0 };

        // Determine min and max strikes to set graph bounds
        const strikes = basket.map(b => b.strike);
        const minStrike = Math.min(...strikes, currentSpot);
        const maxStrike = Math.max(...strikes, currentSpot);
        
        // Add padding to the graph (e.g. +/- 5%)
        const rangePadding = currentSpot * 0.05;
        const startPrice = Math.floor(minStrike - rangePadding);
        const endPrice = Math.ceil(maxStrike + rangePadding);
        
        const step = currentSpot > 10000 ? 50 : 10; // Resolution of graph points
        
        const data = [];
        let maxLoss = 0;
        let maxProfit = 0;

        for (let spot = startPrice; spot <= endPrice; spot += step) {
            let totalPnL = 0;

            basket.forEach(leg => {
                let legPnL = 0;
                // Expiry Payoff Logic
                if (leg.type === 'CE') {
                    const intrinsic = Math.max(0, spot - leg.strike);
                    legPnL = leg.action === 'BUY' 
                        ? (intrinsic - leg.price) * (leg.qty * lotSize)
                        : (leg.price - intrinsic) * (leg.qty * lotSize);
                } else if (leg.type === 'PE') {
                    const intrinsic = Math.max(0, leg.strike - spot);
                    legPnL = leg.action === 'BUY'
                        ? (intrinsic - leg.price) * (leg.qty * lotSize)
                        : (leg.price - intrinsic) * (leg.qty * lotSize);
                }
                totalPnL += legPnL;
            });

            if (totalPnL < maxLoss) maxLoss = totalPnL;
            if (totalPnL > maxProfit) maxProfit = totalPnL;

            data.push({
                spot,
                pnl: totalPnL
            });
        }

        return { data, maxLoss, maxProfit };
    }, [basket, currentSpot, lotSize]);

    if (basket.length === 0) {
        return <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">Add contracts to see payoff graph</div>;
    }

    const { data, maxLoss, maxProfit } = payoffData;

    // Split data into positive (green) and negative (red) for gradient mapping
    const gradientOffset = () => {
        const dataMax = Math.max(Math.abs(maxProfit), Math.abs(maxLoss));
        if (dataMax <= 0) return 0;
        if (maxProfit <= 0) return 0;
        if (maxLoss >= 0) return 1;

        return maxProfit / (maxProfit - maxLoss);
    };

    const off = gradientOffset();

    const formatCurrency = (val: number) => {
        if (Math.abs(val) > 100000) return `₹${(val/100000).toFixed(2)}L`;
        if (Math.abs(val) > 1000) return `₹${(val/1000).toFixed(1)}k`;
        return `₹${val.toFixed(0)}`;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 bg-muted/20 border-b text-xs">
                <div className="flex gap-4">
                    <span className="text-muted-foreground">Max Profit: <span className="font-bold text-profit">{maxProfit > 999999 ? 'Unlimited' : formatCurrency(maxProfit)}</span></span>
                    <span className="text-muted-foreground">Max Loss: <span className="font-bold text-destructive">{maxLoss < -999999 ? 'Unlimited' : formatCurrency(maxLoss)}</span></span>
                </div>
                <div className="text-muted-foreground font-mono">Current Spot: {currentSpot.toFixed(2)}</div>
            </div>
            <div className="flex-1 p-2 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#16A34A" stopOpacity={0.4} /> {/* Profit Green */}
                                <stop offset={off} stopColor="#DC2626" stopOpacity={0.4} /> {/* Loss Red */}
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                        <XAxis 
                            dataKey="spot" 
                            type="number" 
                            domain={['dataMin', 'dataMax']} 
                            tickCount={7}
                            tick={{fontSize: 10, fill: '#888'}}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v.toFixed(0)}
                        />
                        <YAxis 
                            hide={true} 
                            domain={['dataMin', 'dataMax']} 
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value: any) => [formatCurrency(value as number), 'Est. P&L']}
                            labelFormatter={(label: any) => `Spot: ${label}`}
                        />
                        {/* 0 P&L Line */}
                        <ReferenceLine y={0} stroke="#888" strokeOpacity={0.5} />
                        {/* Current Spot Line */}
                        <ReferenceLine x={currentSpot} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: 'Spot', fill: 'hsl(var(--primary))', fontSize: 10 }} />
                        
                        <Area 
                            type="monotone" 
                            dataKey="pnl" 
                            stroke="url(#splitColor)" 
                            fill="url(#splitColor)" 
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
