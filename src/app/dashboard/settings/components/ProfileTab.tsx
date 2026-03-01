'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Camera, Twitter, Linkedin, Globe2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function ProfileTab({ settings, updateSetting }: { settings: any, updateSetting: (section: string, key: string, value: any) => void }) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();
    const { user } = useAuth();

    // Safety fallback
    const profile = settings?.profile || { username: '', bio: '', country: 'India', avatar_url: '', twitter_url: '', linkedin_url: '' };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Avatar size limit exceeded. Maximum size is 2MB.");
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            updateSetting('profile', 'avatar_url', data.publicUrl);
            toast.success("Avatar uploaded! Remember to click Save.");
        } catch (error: any) {
            toast.error("Error uploading avatar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Public Profile</h2>
                <p className="text-sm text-gray-600 dark:text-textSecondary">Manage your avatar, bio, and social links displayed on your public leaderboard page.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#1E40AF] to-[#38BDF8] relative group overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'Trader'}`}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover border-4 border-[#1E232F]"
                        />
                        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10">
                            <Camera className="w-6 h-6 text-white mb-1" />
                            <span className="text-[10px] uppercase font-bold text-white tracking-widest">{uploading ? 'UPLOADING...' : 'CHANGE'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold text-gray-700 dark:text-textPrimary flex justify-between">
                            Display Name
                        </label>
                        <Input
                            value={profile.username || ''}
                            onChange={(e) => updateSetting('profile', 'username', e.target.value)}
                            placeholder="e.g. TradingNinja99"
                            maxLength={25}
                            className="bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary placeholder:text-gray-400 border border-gray-300 dark:border-settings-border focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold text-gray-700 dark:text-textPrimary flex justify-between">
                            Trader Bio
                            <span className={`text-xs ${profile.bio?.length > 150 ? 'text-danger' : 'text-gray-500 dark:text-textMuted'}`}>
                                {profile.bio?.length || 0}/160
                            </span>
                        </label>
                        <textarea
                            value={profile.bio || ''}
                            onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                            placeholder="I trade breakout patterns using MACD and volume confirmation..."
                            maxLength={160}
                            className="w-full h-24 rounded-lg bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary placeholder:text-gray-400 border border-gray-300 dark:border-settings-border focus:ring-2 focus:ring-blue-500 transition-all text-sm p-3 resize-none font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                            <label className="text-sm font-semibold text-gray-700 dark:text-textPrimary">Country</label>
                            <div className="relative">
                                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-textSecondary" />
                                <select
                                    value={profile.country || 'India'}
                                    onChange={(e) => updateSetting('profile', 'country', e.target.value)}
                                    className="w-full h-10 rounded-md bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary border border-gray-300 dark:border-settings-border text-sm pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none outline-none font-medium"
                                >
                                    <option value="India">🇮🇳 India</option>
                                    <option value="USA">🇺🇸 United States</option>
                                    <option value="UK">🇬🇧 United Kingdom</option>
                                    <option value="UAE">🇦🇪 UAE</option>
                                    <option value="Singapore">🇸🇬 Singapore</option>
                                    <option value="Global">🌍 Global</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-settings-border space-y-4">
                        <h3 className="text-sm font-bold tracking-wide text-gray-700 dark:text-textPrimary uppercase">Social Links</h3>

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 bg-[#1DA1F2]/10 rounded-md">
                                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                                </div>
                                <Input
                                    value={profile.twitter_url || ''}
                                    onChange={(e) => updateSetting('profile', 'twitter_url', e.target.value)}
                                    placeholder="https://twitter.com/username"
                                    className="pl-12 bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary placeholder:text-gray-400 border border-gray-300 dark:border-settings-border focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 bg-[#0A66C2]/10 rounded-md">
                                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                                </div>
                                <Input
                                    value={profile.linkedin_url || ''}
                                    onChange={(e) => updateSetting('profile', 'linkedin_url', e.target.value)}
                                    placeholder="https://linkedin.com/in/username"
                                    className="pl-12 bg-white dark:bg-settings-bg text-gray-900 dark:text-textPrimary placeholder:text-gray-400 border border-gray-300 dark:border-settings-border focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
