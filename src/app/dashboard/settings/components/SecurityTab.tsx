import { ShieldCheck, Key, Smartphone, LogOut, CheckCircle2 } from 'lucide-react';

export function SecurityTab({ user }: { user: any }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Account Security</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Manage your password, 2FA, and authorized device sessions.</p>
            </div>

            <div className="bg-white dark:bg-settings-card border border-gray-200 dark:border-settings-border rounded-xl p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800/50 rounded-full h-fit">
                            <Key className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">Password</h4>
                            <p className="text-xs text-gray-500 dark:text-textMuted mt-1 max-w-sm">It's a good idea to use a strong password that you're not using elsewhere.</p>
                        </div>
                    </div>
                    <button className="bg-gray-100 dark:bg-[#1E232F] hover:bg-gray-200 dark:hover:bg-[#2B313F] text-sm text-gray-900 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-700">
                        Change Password
                    </button>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-800/50" />

                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800/50 rounded-full h-fit">
                            <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">Two-Factor Authentication (2FA)</h4>
                                <span className="bg-red-500/10 text-red-500 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20 uppercase">Disabled</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-textMuted mt-1 max-w-sm">Add an extra layer of security to your account using an authenticator app.</p>
                        </div>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-sm text-white px-4 py-2 rounded-lg font-medium transition-colors border border-indigo-500">
                        Enable 2FA
                    </button>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-800/50" />

                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800/50 rounded-full h-fit">
                            <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-textPrimary">Active Sessions</h4>
                            <p className="text-xs text-gray-500 dark:text-textMuted mt-1 max-w-sm">You are currently logged in on <strong className="text-gray-900 dark:text-gray-300">1</strong> device.</p>
                        </div>
                    </div>
                    <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 font-medium transition-colors">
                        Log out all devices
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-700 dark:text-emerald-100/70">Your email <strong className="text-emerald-900 dark:text-white">{user?.email}</strong> is verified.</p>
            </div>
        </div>
    );
}
