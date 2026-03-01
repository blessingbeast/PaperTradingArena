const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
    const { data: stats, error: err1 } = await supabase.from('user_stats').select('username, total_equity, total_pnl, is_hidden');
    console.log('User Stats Data:', stats);
    console.log('User Stats Err:', err1);

    const { data: snaps, error: err2 } = await supabase.from('leaderboard_snapshots').select('user_id, rank, equity');
    console.log('Leaderboard Snaps Data:', snaps);
    console.log('Leaderboard Snaps Err:', err2);
}
check();
