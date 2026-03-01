import { Bell, BellRing, Mail, Smartphone, Trophy, AlertTriangle } from 'lucide-react';

export function NotificationsTab({ settings, updateSetting }: { settings: any, updateSetting: (section: string, key: string, value: any) => void }) {
    const notifications = settings?.notifications || { trade_executed: true, margin_warning: true, rank_change: true, email_alerts: false };

    const Toggle = ({ label, description, keyName, value, icon: Icon }: { label: string, description: string, keyName: string, value: boolean, icon: any }) => {
        return (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4 flex-1 pr-4">
                    <div className="p-2 bg-gray-100 dark:bg-[#1E232F] rounded-lg shadow-inner">
                        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">{label}</h4>
                        <p className="text-xs text-gray-500 dark:text-textMuted mt-1">{description}</p>
                    </div>
                </div>
                <button
                    onClick={() => updateSetting('notifications', keyName, !value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0F172A] ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
                        <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Notifications & Alerts</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Choose which events trigger on-screen toast notifications or email digests.</p>
            </div>

            <div className="grid gap-4">
                <Toggle
                    label="Trade Executed"
                    description="Get an immediate ding when your limit or market orders are filled."
                    keyName="trade_executed"
                    value={notifications.trade_executed}
                    icon={BellRing}
                />
                <Toggle
                    label="Margin & Liquidation Warning"
                    description="Alerts when your active equity falls near liquidation boundaries."
                    keyName="margin_warning"
                    value={notifications.margin_warning}
                    icon={AlertTriangle}
                />
                <Toggle
                    label="Leaderboard Rank Change"
                    description="Notify me when I move up or down the Top 100 global leaderboard."
                    keyName="rank_change"
                    value={notifications.rank_change}
                    icon={Trophy}
                />
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800/50">
                <Toggle
                    label="Email Alerts (Daily Digest)"
                    description="Receive a summary of your P&L, completed trades, and major market movers."
                    keyName="email_alerts"
                    value={notifications.email_alerts}
                    icon={Mail}
                />
            </div>
        </div>
    );
}
