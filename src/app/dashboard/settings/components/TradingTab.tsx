import { Sliders, Zap, Clock, ShieldAlert } from 'lucide-react';

export function TradingTab({ settings, updateSetting }: { settings: any, updateSetting: (section: string, key: string, value: any) => void }) {
    const trading = settings?.trading || { default_order_type: 'MARKET', default_qty: 1, auto_sl_target: false, slippage_simulation: true, price_refresh_speed: 1 };

    const Toggle = ({ label, description, keyName, value }: { label: string, description: string, keyName: string, value: boolean }) => {
        return (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1 pr-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">{label}</h4>
                    <p className="text-xs text-gray-500 dark:text-textMuted mt-1">{description}</p>
                </div>
                <button
                    onClick={() => updateSetting('trading', keyName, !value)}
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
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                        <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Trading Preferences</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Configure your default order parameters and simulator mechanics.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Default Order Type</label>
                        <select
                            value={trading.default_order_type}
                            onChange={(e) => updateSetting('trading', 'default_order_type', e.target.value)}
                            className="w-full h-10 rounded-md bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary border border-gray-300 dark:border-settings-border text-sm px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none font-medium transition-colors"
                        >
                            <option value="MARKET">Market Order</option>
                            <option value="LIMIT">Limit Order</option>
                        </select>
                    </div>

                    <div className="space-y-2 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Default Trade Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={trading.default_qty || 1}
                            onChange={(e) => updateSetting('trading', 'default_qty', parseInt(e.target.value) || 1)}
                            className="w-full h-10 rounded-md bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary border border-gray-300 dark:border-settings-border text-sm px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                        />
                    </div>

                    <div className="space-y-2 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Market Data Refresh Speed</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-textSecondary" />
                            <select
                                value={trading.price_refresh_speed}
                                onChange={(e) => updateSetting('trading', 'price_refresh_speed', parseInt(e.target.value))}
                                className="w-full h-10 rounded-md bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary border border-gray-300 dark:border-settings-border text-sm pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none font-medium transition-colors"
                            >
                                <option value="1">1 second (Real-time)</option>
                                <option value="5">5 seconds</option>
                                <option value="10">10 seconds (Low bandwidth)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
                    <Toggle
                        label="Auto Stop-Loss & Target"
                        description="Automatically attach 1% Target and 0.5% Stop Loss to new orders."
                        keyName="auto_sl_target"
                        value={trading.auto_sl_target}
                    />
                    <Toggle
                        label="Slippage Simulation"
                        description="Simulate realistic bid/ask spreads and slight price slippage on Market Orders."
                        keyName="slippage_simulation"
                        value={trading.slippage_simulation}
                    />
                </div>

                <div className="bg-blue-50 dark:bg-[#1E232F] border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex gap-4 mt-6">
                    <ShieldAlert className="w-8 h-8 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200">Simulator Mechanics</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            PaperTradingArena executes your orders against live delayed market data. By leaving Slippage Simulation on, you get a much more accurate representation of how your strategy performs under actual market constraints rather than hitting perfect hypothetical ticks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
