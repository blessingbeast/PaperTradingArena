
/**
 * Financial Utilities for Black-Scholes Option Pricing
 */

// Standard Normal cumulative distribution function
export function cdfNormal(x: number) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) p = 1 - p;
    return p;
}

// Standard Normal Probability Density Function
export function pdfNormal(x: number) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Simplified Black-Scholes for European Options
 * @param S Stock Price
 * @param K Strike Price
 * @param T Time to expiry in years
 * @param r Risk-free rate
 * @param sigma Volatility (decimal)
 * @param type 'CE' or 'PE'
 */
export function calculateBlackScholes(S: number, K: number, T: number, r: number, sigma: number, type: 'CE' | 'PE' | 'CALL' | 'PUT') {
    if (T <= 0) T = 0.00001; // Avoid division by zero
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    let price, delta, gamma, theta, vega;

    gamma = pdfNormal(d1) / (S * sigma * Math.sqrt(T));
    vega = S * pdfNormal(d1) * Math.sqrt(T) / 100; // Divided by 100 for 1% change

    const isCall = type === 'CE' || type === 'CALL';

    if (isCall) {
        const nd1 = cdfNormal(d1);
        const nd2 = cdfNormal(d2);
        price = S * nd1 - K * Math.exp(-r * T) * nd2;
        delta = nd1;
        theta = (- (S * sigma * pdfNormal(d1)) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd2) / 365;
    } else {
        const n_d1 = cdfNormal(-d1);
        const n_d2 = cdfNormal(-d2);
        price = K * Math.exp(-r * T) * n_d2 - S * n_d1;
        delta = -n_d1;
        theta = (- (S * sigma * pdfNormal(d1)) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * n_d2) / 365;
    }

    return {
        price: Math.max(0.05, price),
        delta: delta,
        gamma: gamma,
        theta: theta,
        vega: vega,
        iv: sigma * 100
    };
}
