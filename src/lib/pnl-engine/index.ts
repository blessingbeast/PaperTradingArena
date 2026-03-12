/**
 * PnL Calculation Engine
 * Safely computes chronological Weighted Average Price matching historical flow equations.
 * Resilient to column name variations (trade_type / side, requested_price / execution_price / price).
 */

export interface OrderFlow {
    // Accept both legacy and new column names
    trade_type?: 'BUY' | 'SELL' | string;
    side?: 'BUY' | 'SELL' | string;
    qty?: number;
    quantity?: number;
    requested_price?: number;
    execution_price?: number;
    price?: number;
    created_at: string;
}

export interface PositionState {
    qty: number;
    total_invested: number;
    avg_price: number;
    entry_time?: string;
}

export function aggregateOrdersToPosition(orders: OrderFlow[]): PositionState {
    let state: PositionState = {
        qty: 0,
        total_invested: 0,
        avg_price: 0
    };

    orders.forEach(order => {
        // Resolve column name aliases: trade_type OR side
        const direction = (order.trade_type || order.side || 'BUY').toUpperCase();
        // Resolve qty aliases: qty OR quantity (use whichever is non-zero)
        const rawQty = Number(order.qty || order.quantity || 0);
        // Resolve price aliases: requested_price OR execution_price OR price (use first non-zero)
        const tradePrice = Number(order.requested_price || order.execution_price || order.price || 0);

        if (rawQty <= 0 || tradePrice <= 0) return; // Skip invalid rows

        const flowQty = direction === 'BUY' ? rawQty : -rawQty;
        const absoluteFlowInvestment = rawQty * tradePrice;

        if (state.qty === 0) {
            // Opening a new position (long or short)
            state.total_invested = absoluteFlowInvestment;
            state.avg_price = tradePrice;
            state.entry_time = order.created_at;
        } else if ((state.qty > 0 && flowQty > 0) || (state.qty < 0 && flowQty < 0)) {
            // Adding to existing position in the same direction → recalculate weighted avg
            state.total_invested += absoluteFlowInvestment;
            state.avg_price = state.total_invested / (Math.abs(state.qty) + rawQty);
        } else {
            // Closing or flipping
            const currentAbsoluteQty = Math.abs(state.qty);
            const fraction = rawQty / currentAbsoluteQty;
            if (fraction > 1) {
                // Position flip: reduce to zero then open in opposite direction
                const flipQty = rawQty - currentAbsoluteQty;
                state.total_invested = flipQty * tradePrice;
                state.avg_price = tradePrice;
                state.entry_time = order.created_at;
            } else {
                // Partial close: reduce total invested proportionally
                state.total_invested -= state.total_invested * fraction;
            }
        }

        state.qty += flowQty;
    });

    return state;
}

export function calculateUnrealizedPnL(avgPrice: number, ltp: number, qty: number): number {
    return (ltp - avgPrice) * qty;
}
