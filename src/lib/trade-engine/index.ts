/**
 * Trade Engine
 * Assesses Execution validity including Market Hours and basic lot sizing algorithms.
 */

export interface MarketHoursResult {
    isOpen: boolean;
    reason?: string;
}

export function validateMarketHours(): MarketHoursResult {
    const nowLocal = new Date();
    
    // Convert to IST safely
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const isNowUTC = Date.UTC(
         nowLocal.getUTCFullYear(),
         nowLocal.getUTCMonth(),
         nowLocal.getUTCDate(),
         nowLocal.getUTCHours(),
         nowLocal.getUTCMinutes(),
         nowLocal.getUTCSeconds()
    );
    const nowIST = new Date(isNowUTC + istOffset);

    const dayOfWeek = nowIST.getUTCDay();
    const hour = nowIST.getUTCHours();
    const minute = nowIST.getUTCMinutes();

    // Weekend Check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isOpen: false, reason: 'Market is closed on weekends.' };
    }

    const timeHHMM = hour * 100 + minute;
    // Market Hours: 9:15 AM (915) to 3:30 PM (1530)
    if (timeHHMM < 915 || timeHHMM >= 1530) {
        return { isOpen: false, reason: 'Market is closed. Trading hours are 9:15 AM to 3:30 PM IST.' };
    }

    return { isOpen: true };
}

export function scaleQuantity(lots: number, lotSize: number): number {
    return lots * lotSize;
}
