
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SettingsPage() {
    const { user, signOut } = useAuth();

    const handleReset = () => {
        if (confirm("Are you sure you want to reset your portfolio amount to ₹10 Lakh? All trades will be cleared.")) {
            alert("Portfolio Reset!");
            // API Call to reset
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || ''} disabled />
                    </div>

                    <Button variant="outline" onClick={() => signOut()}>
                        Sign Out
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-lg">
                        <div>
                            <h3 className="font-medium text-red-900 dark:text-red-400">Reset Portfolio</h3>
                            <p className="text-sm text-red-700 dark:text-red-500">
                                Clear all trades and reset balance to starting capital.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Dark Mode (Coming Soon)</span>
                        <div className="h-6 w-11 bg-gray-200 rounded-full relative cursor-not-allowed">
                            <div className="h-4 w-4 bg-white rounded-full absolute top-1 left-1" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
