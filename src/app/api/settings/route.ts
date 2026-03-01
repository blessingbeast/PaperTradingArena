import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Ensure values are being destructured and explicitly mapped to prevent injection
        const updates = [];

        if (body.profile) {
            updates.push(
                supabase.from('profiles').upsert({
                    id: user.id,
                    username: body.profile.username,
                    bio: body.profile.bio,
                    country: body.profile.country,
                    avatar_url: body.profile.avatar_url,
                    twitter_url: body.profile.twitter_url,
                    linkedin_url: body.profile.linkedin_url,
                })
            );
        }

        if (body.privacy) {
            updates.push(
                supabase.from('privacy_settings').upsert({
                    user_id: user.id,
                    is_public: body.privacy.is_public,
                    show_trade_history: body.privacy.show_trade_history,
                    show_equity: body.privacy.show_equity,
                    show_win_rate: body.privacy.show_win_rate,
                    hide_open_positions: body.privacy.hide_open_positions
                })
            );

            // Sync fallback for older components still reading from `profiles` directly
            updates.push(
                supabase.from('profiles').update({
                    is_private: !body.privacy.is_public,
                    hide_trades: !body.privacy.show_trade_history,
                    hide_equity: !body.privacy.show_equity
                }).eq('id', user.id)
            );
        }

        if (body.trading) {
            updates.push(
                supabase.from('trading_preferences').upsert({
                    user_id: user.id,
                    default_order_type: body.trading.default_order_type,
                    default_qty: body.trading.default_qty,
                    auto_sl_target: body.trading.auto_sl_target,
                    slippage_simulation: body.trading.slippage_simulation,
                    price_refresh_speed: body.trading.price_refresh_speed
                })
            );
        }

        if (body.notifications) {
            updates.push(
                supabase.from('notification_settings').upsert({
                    user_id: user.id,
                    trade_executed: body.notifications.trade_executed,
                    margin_warning: body.notifications.margin_warning,
                    rank_change: body.notifications.rank_change,
                    email_alerts: body.notifications.email_alerts
                })
            );
        }

        await Promise.all(updates);

        return NextResponse.json({ success: true, message: 'Settings saved successfully' });
    } catch (error: any) {
        console.error("Settings Update Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
