const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
    console.log('Seeding Leaderboard Test Data...');

    const fakeTraders = [
        {
            email: 'goldtrader@test.com',
            username: 'OptionsWhale99',
            equity: 1540000,
            invested: 500000,
            stock_pnl: -20000,
            fno_pnl: 1060000,
            trades: 150,
            password: 'password123'
        },
        {
            email: 'silvertrader@test.com',
            username: 'DiamondHands',
            equity: 500000,
            invested: 250000,
            stock_pnl: 250000,
            fno_pnl: 0,
            trades: 400,
            password: 'password123'
        },
        {
            email: 'bronzetrader@test.com',
            username: 'NiftyScalper',
            equity: 120000,
            invested: 100000,
            stock_pnl: 5000,
            fno_pnl: 15000,
            trades: 80,
            password: 'password123'
        },
        {
            email: 'newbie@test.com',
            username: 'PaperHands',
            equity: 50000,
            invested: 100000,
            stock_pnl: -50000,
            fno_pnl: 0,
            trades: 10,
            password: 'password123'
        }
    ];

    console.log('Fetching existing users...');
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();

    if (usersErr || !usersData?.users?.length) {
        console.error("No users found to seed.", usersErr);
        return;
    }

    const users = usersData.users;
    let i = 0;

    for (const trader of fakeTraders) {
        if (i >= users.length) break;
        const userId = users[i].id;

        console.log(`Setting up mock profile for user ${userId} as ${trader.username}`);

        // Insert profile
        const { error: profileErr } = await supabase.from('profiles').upsert({
            id: userId,
            username: trader.username,
            is_private: false
        }, { onConflict: 'id' });

        if (profileErr) {
            console.error("Profile Err:", profileErr);
            continue;
        }

        // Insert stats
        const returnPct = ((trader.equity - trader.invested) / trader.invested) * 100;
        const totalPnl = trader.stock_pnl + trader.fno_pnl;

        const { error: statsErr } = await supabase.from('leaderboard_stats').upsert({
            user_id: userId,
            total_equity: trader.equity, // Keep in case needed, but schema uses 'equity'
            equity: trader.equity,
            invested: trader.invested,
            total_pnl: totalPnl,
            total_return_pct: returnPct,
            fno_pnl: trader.fno_pnl,
            stock_pnl: trader.stock_pnl,
            trades_count: trader.trades,
            win_rate: 65.5, // Mock value
        }, { onConflict: 'user_id' });

        if (statsErr) {
            console.error("Stats Err:", statsErr);
            require('fs').writeFileSync('error_log.json', JSON.stringify(statsErr, null, 2));
            continue;
        }

        // Insert into leaderboard_snapshots directly
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('leaderboard_snapshots').delete().eq('user_id', userId);

        // Let's create mock ranks. We don't rank them perfectly here but cron job would.
        // We'll run the cron job locally after seeding to fix the ranks!

        // Upsert simple badges
        const badges = [];
        if (trader.trades >= 100) badges.push({ user_id: userId, badge: '100 Trades Club' });
        if (returnPct >= 50) badges.push({ user_id: userId, badge: '50% Return Club' });
        if (trader.fno_pnl > 100000) badges.push({ user_id: userId, badge: 'F&O King' });

        if (badges.length > 0) {
            const { error: badgeErr } = await supabase.from('user_badges').upsert(badges, { onConflict: 'user_id, badge', ignoreDuplicates: true });
            if (badgeErr) console.error("Badge Err:", badgeErr);
        }

        i++;
    }

    // Now trigger the ranking logic
    const { data: snapshots, error: snapErr } = await supabase.from('leaderboard_stats').select('user_id, total_return_pct, total_pnl, equity');
    if (!snapErr && snapshots) {
        // Sort
        snapshots.sort((a, b) => b.total_return_pct - a.total_return_pct);

        const today = new Date().toISOString().split('T')[0];

        const updates = snapshots.map((s, idx) => ({
            user_id: s.user_id,
            period: 'daily',
            snapshot_date: today,
            total_return_pct: s.total_return_pct,
            total_pnl: s.total_pnl,
            equity: s.equity || s.total_equity,
            rank: idx + 1
        }));

        // Delete today's ranks first to avoid duplicates
        await supabase.from('leaderboard_snapshots').delete().eq('period', 'daily').eq('snapshot_date', today);

        const { error: snapUpdateErr } = await supabase.from('leaderboard_snapshots').insert(updates);
        if (snapUpdateErr) console.error("Snap Update Err:", snapUpdateErr);
        else console.log('Ranks updated successfully');
    }

    console.log('Done!');
}

seed();
