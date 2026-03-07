'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, Banknote, Landmark, Activity, BarChart4 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function AdminSystemPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setMetrics(data.metrics || null);
            }
        } catch (e) {
            toast.error('Failed to load system telemetry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
                <p className="text-muted-foreground mt-2">Deeper telemetry regarding platform health and global capital velocity.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registered User Base</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total active database nodes</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Liquidity</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{formatCurrency(metrics?.globalPlatformCapital || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total simulated capital active</p>
                    </CardContent>
                </Card>
                
                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Realized PnL</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-mono ${metrics?.globalPlatformRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(metrics?.globalPlatformRealizedPnL || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Net historical returns across all accounts</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Order Velocity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Historical database order commits</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Traded Volume</CardTitle>
                        <BarChart4 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(metrics?.volumeInvested || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total combined value of all executed platform trades natively.</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-8 rounded-xl border border-border/50 bg-secondary/20 p-8 flex flex-col items-center justify-center text-center">
                <BarChart4 className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">Visualization Charts Standby</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                   Historic timescale charts utilizing Chart.js native libraries will mount here in V2 telemetry nodes.
                </p>
            </div>
        </div>
    );
}
