/**
 * Trade Engine
 * Assesses Execution validity including Market Hours and basic lot sizing algorithms.
 */

import { createClient } from '@/lib/supabase/server';

export interface MarketHoursResult {
    isOpen: boolean;
    reason?: string;
}

export async function validateMarketHours(): Promise<MarketHoursResult> {
    const supabase = await createClient();
    
    // 1. Check Global Admin Override FIRST
    const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'market_open').single();
    if (setting && setting.value === 'false') {
        return { isOpen: false, reason: 'Market is currently forced CLOSED by System Administrator.' };
    }

    // 2. Standard Chronological IST Checks
    const nowLocal = new Date();
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

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isOpen: false, reason: 'Market is closed on weekends.' };
    }

    const timeHHMM = hour * 100 + minute;
    if (timeHHMM < 915 || timeHHMM >= 1530) {
        return { isOpen: false, reason: 'Market is closed. Trading hours are 9:15 AM to 3:30 PM IST.' };
    }

    return { isOpen: true };
}

export function scaleQuantity(lots: number, lotSize: number): number {
    return lots * lotSize;
}
