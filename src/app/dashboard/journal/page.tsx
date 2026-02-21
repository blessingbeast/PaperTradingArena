'use client';

import React, { useEffect, useState } from 'react';
import { JournalAnalytics } from '@/components/journal/JournalAnalytics';
import { JournalCalendar } from '@/components/journal/JournalCalendar';
import { MistakeSummary } from '@/components/journal/MistakeSummary';
import { TradeList } from '@/components/journal/TradeList';
import { TradeEditModal } from '@/components/journal/TradeEditModal';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function JournalPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [editingEntry, setEditingEntry] = useState<any | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [entriesRes, analyticsRes] = await Promise.all([
                fetch('/api/journal'),
                fetch('/api/journal/analytics')
            ]);

            if (!entriesRes.ok) throw new Error("Failed to fetch journal entries");
            if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");

            setEntries(await entriesRes.json());
            setAnalytics(await analyticsRes.json());

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading && !analytics) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:max-w-7xl max-w-full min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
                    <p className="text-sm text-muted-foreground">Analyze your performance, track mistakes, and improve your edge.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Analytics Overview */}
            {analytics && <JournalAnalytics data={analytics} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    {/* Calendar View */}
                    <JournalCalendar entries={entries} />
                </div>
                <div className="lg:col-span-1">
                    {/* Mistake Summary */}
                    <MistakeSummary entries={entries} />
                </div>
            </div>

            {/* Trade List Table */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Trade Log</h3>
                <TradeList entries={entries} onEdit={(entry) => setEditingEntry(entry)} />
            </div>

            {/* Edit Modal */}
            <TradeEditModal
                entry={editingEntry}
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                onSaved={fetchData}
            />

        </div>
    );
}

