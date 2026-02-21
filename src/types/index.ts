
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

export interface MarketData {
    symbol: string
    price: number
    change: number
    changePercent: number
    name: string
}
