
/**
 * Professional F&O Utilities (Paper Trading Arena)
 * Strictly follows NSE standards and Yahoo Finance ticker formats.
 * NO SIMULATIONS. REAL DATA ONLY.
 */

// Official NSE Lot Sizes (Current as of 2024/2025)
export const LOT_SIZES: Record<string, number> = {
    'NIFTY': 50,
    'BANKNIFTY': 15,
    'FINNIFTY': 40,
    'MIDCPNIFTY': 75,
    'SENSEX': 10,
    'BANKEX': 15,

    // Major Stocks
    'RELIANCE': 250,
    'HDFCBANK': 550,
    'ICICIBANK': 700,
    'INFY': 400,
    'TCS': 175,
    'SBIN': 1500,
    'BHARTIARTL': 950,
    'ITC': 1600,
    'AXISBANK': 625,
    'KOTAKBANK': 400,
};

/**
 * Gets the correct Lot Size for an underlying symbol.
 */
export function getLotSize(symbol: string): number {
    const base = symbol.toUpperCase().split(/\d/)[0].trim().replace('.NS', '').replace('^NSEBANK', 'BANKNIFTY').replace('^NSEI', 'NIFTY');
    return LOT_SIZES[base] || 1;
}

/**
 * Maps to professional Yahoo Finance Option Ticker.
 * Format: [ROOT][YY][MM][DD][C/P][8-DIGIT STRIKE].NS
 * Example: NIFTY260326C00025200.NS
 */
export function mapToYahooTicker(underlying: string, expiry: Date | string, strike: number, type: 'C' | 'P' | 'CE' | 'PE'): string {
    const root = underlying.toUpperCase().replace('.NS', '').replace('^NSEBANK', 'BANKNIFTY').replace('^NSEI', 'NIFTY');

    const dt = new Date(expiry);
    const yy = dt.getFullYear().toString().slice(-2);
    const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = dt.getDate().toString().padStart(2, '0');

    const t = type.startsWith('C') ? 'C' : 'P';
    const strikeStr = Math.round(strike).toString().padStart(8, '0');

    return `${root}${yy}${mm}${dd}${t}${strikeStr}.NS`;
}

/**
 * Constructs official NSE Option Symbol (for display and DB storage).
 * Format: SYMBOL + YY + MMM + [DD] + STRIKE + CE/PE
 * Example: NIFTY26MAR2625200CE
 */
export function constructNSESymbol(underlying: string, expiry: Date | string, strike: number, type: 'CE' | 'PE'): string {
    const root = underlying.toUpperCase().replace('.NS', '').replace('^NSEBANK', 'BANKNIFTY').replace('^NSEI', 'NIFTY');
    const dt = new Date(expiry);
    const yy = dt.getFullYear().toString().slice(-2);
    const mmm = dt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const dd = dt.getDate().toString().padStart(2, '0');
    const strikeStr = Math.round(strike).toString();

    return `${root}${yy}${mmm}${dd}${strikeStr}${type}`;
}

/**
 * Professional NSE Expiry Logic.
 * 
 * NIFTY -> Thursday (Weekly)
 * BANKNIFTY Weekly -> Wednesday
 * BANKNIFTY Monthly -> Last Thursday
 * Stocks -> Last Thursday
 */
export function getNextExpiries(symbol: string, count: number = 5): string[] {
    const upper = symbol.toUpperCase();
    const expiries: string[] = [];
    const today = new Date();

    let current = new Date(today);
    // Find upcoming Thursdays and Wednesdays for the next 3 months
    const potentialDates: Date[] = [];
    for (let i = 0; i < 100; i++) {
        current.setDate(current.getDate() + 1);
        if (current.getDay() === 3 || current.getDay() === 4) {
            potentialDates.push(new Date(current));
        }
    }

    const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
    const isStock = !indices.some(idx => upper.includes(idx));

    if (isStock) {
        // Stocks expire ONLY on the Last Thursday of the month
        const monthlyDates = potentialDates.filter(d => {
            if (d.getDay() !== 4) return false;
            // Is it the last Thursday?
            const nextWeek = new Date(d);
            nextWeek.setDate(d.getDate() + 7);
            return nextWeek.getMonth() !== d.getMonth();
        });
        return monthlyDates.slice(0, count).map(d => d.toISOString().split('T')[0]);
    }

    if (upper.includes('BANKNIFTY')) {
        // BANKNIFTY: Weekly on Wed, Monthly on Last Thu
        const bankExpiries = potentialDates.filter(d => {
            const nextWeek = new Date(d);
            nextWeek.setDate(d.getDate() + 7);
            const isLastWeekOfData = nextWeek.getMonth() !== d.getMonth();

            if (isLastWeekOfData) {
                return d.getDay() === 4; // Monthly on Thursday
            } else {
                return d.getDay() === 3; // Weekly on Wednesday
            }
        });
        return bankExpiries.slice(0, count).map(d => d.toISOString().split('T')[0]);
    }

    if (upper.includes('NIFTY')) {
        // NIFTY: Always Thursday
        return potentialDates.filter(d => d.getDay() === 4).slice(0, count).map(d => d.toISOString().split('T')[0]);
    }

    if (upper.includes('FINNIFTY')) {
        return potentialDates.filter(d => d.getDay() === 2).slice(0, count).map(d => d.toISOString().split('T')[0]);
    }

    // Default to Thursdays
    return potentialDates.filter(d => d.getDay() === 4).slice(0, count).map(d => d.toISOString().split('T')[0]);
}

/**
 * Parses an NSE Option Symbol.
 */
export function parseNSESymbol(symbol: string) {
    if (!symbol) return null;
    const match = symbol.match(/^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/);
    if (!match) return null;

    return {
        underlying: match[1],
        yy: match[2],
        mmm: match[3],
        dd: match[4],
        strike: parseFloat(match[5]),
        type: match[6]
    };
}
