import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export interface IndicatorSettings {
    RSI: { period: number; color: string; };
    MACD: { fastPeriod: number; slowPeriod: number; signalPeriod: number; macdColor: string; signalColor: string; };
    EMA: { period: number; color: string; };
    SMA: { period: number; color: string; };
    BB: { period: number; stdDev: number; color: string; };
    VWAP: { color: string; };
}

export const defaultIndicatorSettings: IndicatorSettings = {
    RSI: { period: 14, color: '#9C27B0' },
    MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, macdColor: '#2962FF', signalColor: '#FF6D00' },
    EMA: { period: 20, color: '#2962FF' },
    SMA: { period: 50, color: '#FF6D00' },
    BB: { period: 20, stdDev: 2, color: '#2962FF' },
    VWAP: { color: '#E91E63' }
};

interface IndicatorSettingsModalProps {
    indicator: keyof IndicatorSettings;
    currentSettings: IndicatorSettings[keyof IndicatorSettings];
    onSave: (indicator: keyof IndicatorSettings, newSettings: any) => void;
    onClose: () => void;
}

export function IndicatorSettingsModal({ indicator, currentSettings, onSave, onClose }: IndicatorSettingsModalProps) {
    const [settings, setSettings] = useState<any>(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings]);

    const handleChange = (key: string, value: string | number) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = () => {
        // Simple validation
        const finalSettings = { ...settings };
        if (indicator === 'RSI' || indicator === 'EMA' || indicator === 'SMA' || indicator === 'BB') {
            finalSettings.period = Math.max(1, Math.min(200, Number(finalSettings.period) || 14));
        }
        if (indicator === 'MACD') {
            finalSettings.fastPeriod = Math.max(1, Number(finalSettings.fastPeriod) || 12);
            finalSettings.slowPeriod = Math.max(finalSettings.fastPeriod + 1, Number(finalSettings.slowPeriod) || 26);
            finalSettings.signalPeriod = Math.max(1, Number(finalSettings.signalPeriod) || 9);
        }
        if (indicator === 'BB') {
            finalSettings.stdDev = Math.max(0.1, Math.min(10, Number(finalSettings.stdDev) || 2));
        }

        onSave(indicator, finalSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-xl">
                    <h3 className="font-bold text-foreground">{indicator} Settings</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1 rounded-md transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    {/* Common Period Input */}
                    {('period' in settings) && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Length / Period</label>
                            <input
                                type="number"
                                value={settings.period}
                                onChange={(e) => handleChange('period', e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    )}

                    {/* MACD Specific Inputs */}
                    {indicator === 'MACD' && (
                        <>
                            <div className="flex gap-3">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fast Length</label>
                                    <input
                                        type="number" value={settings.fastPeriod} onChange={(e) => handleChange('fastPeriod', e.target.value)}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slow Length</label>
                                    <input
                                        type="number" value={settings.slowPeriod} onChange={(e) => handleChange('slowPeriod', e.target.value)}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signal Smoothing</label>
                                <input
                                    type="number" value={settings.signalPeriod} onChange={(e) => handleChange('signalPeriod', e.target.value)}
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    {/* BB Specific Inputs */}
                    {indicator === 'BB' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">StdDev Multiplier</label>
                            <input
                                type="number" step="0.1" value={settings.stdDev} onChange={(e) => handleChange('stdDev', e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Visuals / Colors */}
                    <div className="w-full h-px bg-border/50 my-2" />

                    {indicator === 'MACD' ? (
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MACD Line</label>
                                <input type="color" value={settings.macdColor} onChange={(e) => handleChange('macdColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signal Line</label>
                                <input type="color" value={settings.signalColor} onChange={(e) => handleChange('signalColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plot Color</label>
                            <input
                                type="color"
                                value={settings.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/10 rounded-b-xl flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 rounded-md font-medium bg-muted hover:bg-accent text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
