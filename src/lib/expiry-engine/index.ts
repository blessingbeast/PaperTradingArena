/**
 * Expiry Engine
 * Isolates timestamp-based derivatives logic for fast chronological verification
 */

export function isContractExpired(expiryDateStr: string): boolean {
    if (!expiryDateStr) return false;

    try {
        const todayIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const todayISTStr = todayIST.toISOString().split('T')[0];
        
        // Handle various NSE string formats like '31-Jan-2024' or native '2024-01-31'
        let parsedDate: Date;
        if (expiryDateStr.includes('-') && expiryDateStr.length === 11) {
            // DD-MMM-YYYY
            parsedDate = new Date(expiryDateStr);
        } else {
            // Standard parse
            parsedDate = new Date(expiryDateStr);
        }

        const expiryStr = parsedDate.toISOString().split('T')[0];
        return expiryStr < todayISTStr;
    } catch(e) {
         console.warn("Failed to parse FO Expiry:", expiryDateStr);
         return false; // Fail safe, don't drop blindly
    }
}
