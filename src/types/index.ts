
export interface User {
    id: string
    email: string
    username?: string
    avatar_url?: string
}

export interface Portfolio {
    id: string
    user_id: string
    balance: number
    starting_capital: number
    total_pnl: number
}

export interface Trade {
    id: string
    user_id: string
    symbol: string
    type: 'BUY' | 'SELL'
    qty: number
    price: number
    instrument_type: 'EQUITY' | 'F&O'
    expiry?: string
    strike_price?: number
    option_type?: 'CE' | 'PE'
    timestamp: string
}

export interface Position {
    id: string
    user_id: string
    symbol: string
    qty: number
    avg_price: number
    instrument_type: 'EQUITY' | 'F&O'
    expiry?: string
    strike_price?: number
    option_type?: 'CE' | 'PE'
    // Extended fields for dashboard
    ltp?: number;
    current?: number;
    invested?: number;
    pnl?: number;
    percent?: number;
}

export interface FAndOPosition {
    id: string;
    user_id: string;
    contract_symbol: string;
    underlying_symbol: string;
    instrument_type: 'FUT' | 'OPT';
    option_type?: 'CE' | 'PE';
    strike_price?: number;
    expiry_date: string;
    qty: number;
    lot_size: number;
    avg_price: number;
    created_at: string;
    // Computed for UI
    ltp?: number;
    current?: number;
    invested?: number;
    pnl?: number;
    percent?: number;
}

export interface OptionContract {
    id: string;
    symbol: string;
    underlying_symbol: string;
    expiry_date: string;
    strike_price: number;
    option_type: 'CE' | 'PE';
    lot_size: number;
    last_price?: number;
    bid?: number;
    ask?: number;
    iv?: number;
    delta?: number;
    theta?: number;
    gamma?: number;
    vega?: number;
}

export interface FutureContract {
    id: string;
    symbol: string;
    underlying_symbol: string;
    expiry_date: string;
    lot_size: number;
    last_price?: number;
    bid?: number;
    ask?: number;
}

export interface MarketData {
    symbol: string
    price: number
    change: number
    changePercent: number
    name: string
}
