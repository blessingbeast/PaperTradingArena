'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Power, PowerOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMarketPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/market');
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings || {});
            }
        } catch (e) {
            toast.error('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const toggleSetting = async (key: string, currentValue: string) => {
        const newValue = currentValue === 'true' ? 'false' : 'true';
        setActionId(key);
        
        try {
            const res = await fetch(`/api/admin/market`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: newValue })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success(`System ${key} set to ${newValue}`);
                fetchSettings();
            } else {
                toast.error(data.error || 'Failed to update system framework');
            }
        } catch (e) {
            toast.error('Execution failure across server runtime');
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const isMarketOpen = settings['market_open'] === 'true';
    const isSimEnabled = settings['simulation_enabled'] === 'true';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Market Control</h1>
                <p className="text-muted-foreground mt-2">Adjust dynamic global runtime simulator states across the entire platform.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm border-t-4 border-t-purple-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                             Market Status 
                             {isMarketOpen ? 
                                <span className="ml-3 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-500">OPEN</span> : 
                                <span className="ml-3 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-500">CLOSED</span>
                             }
                        </CardTitle>
                        <CardDescription>
                            Override the native chronological UTC timezone constraints and forcefully open or lock down trade execution globally.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <Button 
                                variant={isMarketOpen ? 'default' : 'outline'}
                                className={isMarketOpen ? 'bg-green-600 hover:bg-green-700 text-white w-full' : 'w-full'}
                                onClick={() => !isMarketOpen && toggleSetting('market_open', 'false')}
                                disabled={actionId === 'market_open'}
                            >
                                {actionId === 'market_open' && !isMarketOpen ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Power className="w-4 h-4 mr-2" />}
                                Force Open
                            </Button>
                            
                            <Button 
                                variant={!isMarketOpen ? 'destructive' : 'outline'}
                                className={!isMarketOpen ? 'w-full' : 'w-full border-red-500/20 text-red-500 hover:bg-red-500/10'}
                                onClick={() => isMarketOpen && toggleSetting('market_open', 'true')}
                                disabled={actionId === 'market_open'}
                            >
                                {actionId === 'market_open' && isMarketOpen ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <PowerOff className="w-4 h-4 mr-2" />}
                                Force Close
                            </Button>
                        </div>
                   </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm border-t-4 border-t-blue-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                             Simulation Engine 
                             {isSimEnabled ? 
                                <span className="ml-3 px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-500">ONLINE</span> : 
                                <span className="ml-3 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">OFFLINE</span>
                             }
                        </CardTitle>
                        <CardDescription>
                            Toggle the ability for users to append new simulated history. Does not affect active portfolio PnL tracking math.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => toggleSetting('simulation_enabled', settings['simulation_enabled'] || 'false')}
                            disabled={actionId === 'simulation_enabled'}
                        >
                            {actionId === 'simulation_enabled' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ShieldAlert className="w-4 h-4 mr-2" />}
                            {isSimEnabled ? 'Pause Simulator globally' : 'Resume Simulator Globally'}
                        </Button>
                   </CardContent>
                </Card>
            </div>
        </div>
    );
}
