const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = fs.readFileSync('supabase/migrations/20260228124151_create_leaderboard_tables.sql', 'utf8');

async function run() {
    console.log('Executing migration via REST API (execute_sql rpc)...');
    const { error: tErr } = await supabase.rpc('execute_sql', { sql_string: sql });

    if (tErr) {
        console.error("RPC failed. Please run the SQL manually in Supabase SQL Editor:", tErr);
    } else {
        console.log("Success! Leaderboard tables created.");
    }
}
run();
