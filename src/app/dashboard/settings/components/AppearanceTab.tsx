import { Palette, Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function AppearanceTab() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [chartColor, setChartColor] = useState('blue');

    useEffect(() => {
        setMounted(true);
    }, []);

    const themes = [
        { id: 'dark', label: 'Dark Mode', icon: Moon },
        { id: 'light', label: 'Light Mode', icon: Sun },
        { id: 'system', label: 'System Match', icon: Monitor },
    ];

    const colors = [
        { id: 'blue', value: 'bg-blue-500' },
        { id: 'emerald', value: 'bg-emerald-500' },
        { id: 'indigo', value: 'bg-indigo-500' },
        { id: 'rose', value: 'bg-rose-500' },
        { id: 'orange', value: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-pink-100 dark:bg-pink-500/10 rounded-lg">
                        <Palette className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Theme & Appearance</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Customize the look and feel of your terminal.</p>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Interface Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = mounted && theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${isActive
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-white'
                                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-settings-bg text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                                <span className="text-sm font-semibold">{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chart Accent Color</label>
                <p className="text-xs text-gray-500 dark:text-textMuted">Pick a primary accent color for your portfolio charts and buttons.</p>

                <div className="flex gap-4">
                    {colors.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setChartColor(c.id)}
                            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${chartColor === c.id
                                ? 'ring-4 ring-offset-2 ring-offset-[#0F172A] ring-gray-600 scale-110'
                                : 'hover:scale-110 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <span className={`w-full h-full rounded-full ${c.value} shadow-inner`}></span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
