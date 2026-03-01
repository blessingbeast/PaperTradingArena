import { Shield, Eye, EyeOff, Lock, Unlock, CheckCircle2 } from 'lucide-react';

export function PrivacyTab({ settings, updateSetting }: { settings: any, updateSetting: (section: string, key: string, value: any) => void }) {
    const privacy = settings?.privacy || { is_public: true, show_trade_history: true, show_equity: true, show_win_rate: true, hide_open_positions: false };

    const Toggle = ({ label, description, keyName, value, inverted = false }: { label: string, description: string, keyName: string, value: boolean, inverted?: boolean }) => {
        // For some toggles, true means "hide" (inverted), for others true means "show"
        const isActive = value;

        return (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1 pr-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary flex items-center gap-2">
                        {label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-textMuted mt-1">{description}</p>
                </div>
                <button
                    onClick={() => updateSetting('privacy', keyName, !value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0F172A] ${isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Privacy Settings</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Control what visitors can see when viewing your public profile.</p>
            </div>

            <div className="grid gap-4">
                <Toggle
                    label="Public Profile"
                    description="Allow your profile to be discovered on the leaderboard and search."
                    keyName="is_public"
                    value={privacy.is_public}
                />
                <Toggle
                    label="Show Trade History"
                    description="Let others view your past executed orders and transaction log."
                    keyName="show_trade_history"
                    value={privacy.show_trade_history}
                />
                <Toggle
                    label="Show Equity & P&L"
                    description="Display your absolute ₹ balances. If off, only percentages are visible."
                    keyName="show_equity"
                    value={privacy.show_equity}
                />
                <Toggle
                    label="Show Win Rate"
                    description="Display your trading accuracy and win/loss ratio."
                    keyName="show_win_rate"
                    value={privacy.show_win_rate}
                />
                <Toggle
                    label="Hide Open Positions"
                    description="Prevent others from seeing your active holding contracts in real-time."
                    keyName="hide_open_positions"
                    value={privacy.hide_open_positions}
                    inverted={true}
                />
            </div>
        </div>
    );
}
