import { Download, RefreshCcw, AlertOctagon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AccountTab({ user }: { user: any }) {
    const [exporting, setExporting] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/settings/export');
            if (!response.ok) throw new Error('Failed to export');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TradeHistory_${user.id.substring(0, 8)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Export downloaded successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setExporting(false);
        }
    };

    const handleReset = async () => {
        const username = prompt("Type your exact username to confirm account reset:", "");
        if (!username) return;

        setResetting(true);
        try {
            const response = await fetch('/api/settings/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmUsername: username })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to reset account');

            toast.success(data.message);
            // Reload page to reflect fresh state
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Data & Account Actions</h2>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Export your data or permanently delete your account.</p>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">Export Trade History</h4>
                        <p className="text-xs text-gray-500 dark:text-textMuted mt-1 max-w-sm">Download a CSV file containing all your executed paper trades, orders, and P/L records.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-[#1E232F] hover:bg-gray-200 dark:hover:bg-[#2B313F] disabled:opacity-50 text-sm text-gray-900 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-700 shrink-0"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download CSV
                    </button>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-orange-400">Reset Paper Account</h4>
                        <p className="text-xs text-orange-400/70 mt-1 max-w-sm">Wipes all trade history, closes open positions, and resets your balance back to ₹10,00,000.</p>
                    </div>
                    <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-50 text-sm text-orange-400 px-4 py-2.5 rounded-lg font-bold transition-colors border border-orange-500/30 shrink-0"
                    >
                        {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        Reset Portfolio
                    </button>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-red-500">Delete Account</h4>
                        <p className="text-xs text-red-400/70 mt-1 max-w-sm">Permanently delete your entire PaperTradingArena account and data. This cannot be undone.</p>
                    </div>
                    <button
                        onClick={() => toast.error("Account deletion is disabled in this demo.")}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-sm text-white px-4 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-red-500/20 shrink-0"
                    >
                        <AlertOctagon className="w-4 h-4" /> Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
