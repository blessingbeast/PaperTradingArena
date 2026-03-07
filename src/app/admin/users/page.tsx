'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldAlert, Plus, Minus, Ban, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleBalanceMod = async (userId: string, targetEmail: string, type: 'add' | 'subtract') => {
        const amountStr = prompt(`Enter amount to ${type} for ${targetEmail}:`);
        if (!amountStr) return;
        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) return toast.error('Invalid amount');

        setActionId(userId);
        try {
            const res = await fetch('/api/admin/users/update-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, targetEmail, amount, type })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success(`Balance updated successfully.`);
                fetchUsers(); // Refresh grid
            } else {
                toast.error(data.error || 'Failed to update balance');
            }
        } catch (e) {
             toast.error('Network error executing balance change');
        } finally {
             setActionId(null);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-2">Oversee registered authentications and trading balances natively.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Input placeholder="Search emails..." className="max-w-xs bg-card/50" />
                </div>
            </div>

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Balance</th>
                                    <th className="py-3 px-4">Ltf PnL</th>
                                    <th className="py-3 px-4">Joined</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-muted-foreground">No users found</td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-foreground">{user.email}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{user.id.split('-')[0]}...</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.role === 'admin' ? (
                                                <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold inline-flex items-center">
                                                    <ShieldAlert className="w-3 h-3 mr-1" /> Admin
                                                </span>
                                            ) : (
                                                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-mono font-medium">{formatCurrency(user.balance)}</td>
                                        <td className={`py-3 px-4 font-mono font-medium ${user.pnl > 0 ? 'text-green-500' : user.pnl < 0 ? 'text-red-500' : ''}`}>
                                            {formatCurrency(user.pnl)}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm" variant="outline" 
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleBalanceMod(user.id, user.email, 'add')}
                                                    disabled={actionId === user.id}
                                                >
                                                    {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-green-500" />}
                                                </Button>
                                                <Button 
                                                    size="sm" variant="outline" 
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleBalanceMod(user.id, user.email, 'subtract')}
                                                    disabled={actionId === user.id}
                                                >
                                                   {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4 text-orange-500" />}
                                                </Button>
                                                
                                                {/* Destructive capabilities are rendered visually but locked safely behind backend routes pending deployment scale constraints */}
                                                 <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/10 hover:text-red-500">
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/10 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
