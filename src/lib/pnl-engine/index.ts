/**
 * PnL Calculation Engine
 * Safely computes chronological Weighted Average Price matching historical flow equations.
 */

export interface OrderFlow {
    trade_type: 'BUY' | 'SELL';
    qty: number;
    requested_price: number;
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
        const flowQty = order.trade_type === 'BUY' ? order.qty : -order.qty;
        const absoluteFlowInvestment = order.qty * order.requested_price;

        if (state.qty === 0 && flowQty > 0) {
            state.total_invested = absoluteFlowInvestment;
            state.avg_price = order.requested_price;
            state.entry_time = order.created_at;
        } else if (state.qty === 0 && flowQty < 0) {
            state.total_invested = absoluteFlowInvestment;
            state.avg_price = order.requested_price;
            state.entry_time = order.created_at;
        } else if ((state.qty > 0 && flowQty > 0) || (state.qty < 0 && flowQty < 0)) {
            state.total_invested += absoluteFlowInvestment;
            state.avg_price = state.total_invested / (Math.abs(state.qty) + order.qty);
        } else {
            const currentAbsoluteQty = Math.abs(state.qty);
            let fraction = order.qty / currentAbsoluteQty;
            if (fraction > 1) { 
                const flipQty = order.qty - currentAbsoluteQty;
                state.total_invested = flipQty * order.requested_price;
                state.avg_price = order.requested_price;
                state.entry_time = order.created_at;
            } else { 
                state.total_invested -= (state.total_invested * fraction); 
            }
        }

        state.qty += flowQty;
    });

    return state;
}

export function calculateUnrealizedPnL(avgPrice: number, ltp: number, qty: number): number {
    return (ltp - avgPrice) * qty;
}
