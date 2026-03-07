'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (e) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">Immutable chronological trail tracking sensitive structural database adjustments.</p>
            </div>

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-emerald-500/50">
                <div className="overflow-x-auto">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Admin Email</th>
                                    <th className="py-3 px-4">Action Event</th>
                                    <th className="py-3 px-4">Target Identity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center">
                                                <ShieldCheck className="h-10 w-10 text-emerald-500/50 mb-4" />
                                                <p>No administrative interventions recorded.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-xs">
                                            {new Date(log.created_at).toLocaleString('en-IN', {
                                                month: 'short', day: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-primary">{log.users?.email || 'System'}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{log.admin_id.split('-')[0]}...</div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-foreground">{log.action}</td>
                                        <td className="py-3 px-4 text-muted-foreground font-mono bg-secondary/30 rounded px-2 inline-block my-2 text-xs">
                                            {log.target}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
