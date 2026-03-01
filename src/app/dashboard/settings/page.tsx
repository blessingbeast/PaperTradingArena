'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import { SettingsSidebar, SettingsMobileTabs } from './components/SettingsSidebar';
import { ProfileTab } from './components/ProfileTab';
import { PrivacyTab } from './components/PrivacyTab';
import { TradingTab } from './components/TradingTab';
import { NotificationsTab } from './components/NotificationsTab';
import { SecurityTab } from './components/SecurityTab';
import { AppearanceTab } from './components/AppearanceTab';
import { AccountTab } from './components/AccountTab';

export default function SettingsPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [settings, setSettings] = useState({
        profile: { username: '', bio: '', country: 'India', avatar_url: '', twitter_url: '', linkedin_url: '' },
        privacy: { is_public: true, show_trade_history: true, show_equity: true, show_win_rate: true, hide_open_positions: false },
        trading: { default_order_type: 'MARKET', default_qty: 1, auto_sl_target: false, slippage_simulation: true, price_refresh_speed: 1 },
        notifications: { trade_executed: true, margin_warning: true, rank_change: true, email_alerts: false }
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchSettings() {
            if (!user) return;
            try {
                // Fetch Profile
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

                // Fetch Preferences (If relations don't exist yet, catch error gracefully as empty)
                const { data: privacy } = await supabase.from('privacy_settings').select('*').eq('user_id', user.id).maybeSingle();
                const { data: trading } = await supabase.from('trading_preferences').select('*').eq('user_id', user.id).maybeSingle();
                const { data: notifications } = await supabase.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle();

                if (!isMounted) return;

                setSettings(prev => ({
                    profile: { ...prev.profile, ...profile },
                    privacy: { ...prev.privacy, ...privacy },
                    trading: { ...prev.trading, ...trading },
                    notifications: { ...prev.notifications, ...notifications }
                }));
            } catch (error) {
                console.error("Migration possibly missing:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchSettings();
        return () => { isMounted = false; };
    }, [user, supabase]);

    const updateSetting = useCallback((section: string, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section as keyof typeof settings]: {
                ...prev[section as keyof typeof settings],
                [key]: value
            }
        }));
        setHasUnsavedChanges(true);
    }, []);

    // Manual Save for now (Debounce can be added once API route is ready)
    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to save settings');

            toast.success("Settings saved successfully!");
            setHasUnsavedChanges(false);
        } catch (error: any) {
            toast.error("Failed to save settings: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileTab settings={settings} updateSetting={updateSetting} />;
            case 'privacy': return <PrivacyTab settings={settings} updateSetting={updateSetting} />;
            case 'trading': return <TradingTab settings={settings} updateSetting={updateSetting} />;
            case 'notifications': return <NotificationsTab settings={settings} updateSetting={updateSetting} />;
            case 'security': return <SecurityTab user={user} />;
            case 'appearance': return <AppearanceTab />;
            case 'account': return <AccountTab user={user} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 lg:pb-12">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-500 tracking-tight">
                    Account Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your platform preferences and security.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24">
                        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </aside>

                {/* Mobile Tabs */}
                <div className="block lg:hidden w-full -mx-4 px-4 sticky top-16 z-30 bg-gray-50 dark:bg-settings-bg pt-4 pb-2 border-b border-gray-200 dark:border-settings-border">
                    <SettingsMobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="bg-gray-50/50 dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-2xl p-6 md:p-8 min-h-[500px]">
                        {renderTabContent()}
                    </div>
                </main>
            </div>

            {/* Sticky Mobile/Desktop Save Bar */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom w-[90%] md:w-auto">
                    <div className="bg-white dark:bg-[#1E232F] border border-gray-300 dark:border-gray-700 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl flex items-center justify-between gap-6 backdrop-blur-xl">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">You have unsaved changes.</span>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
