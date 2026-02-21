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
const sql = fs.readFileSync('migration_journal.sql', 'utf8');

async function run() {
    console.log('Executing migration via REST API...');

    // Create table
    const { error: tErr } = await supabase.rpc('execute_sql', { sql_string: sql });

    if (tErr) {
        console.log("RPC Execute_sql not found or failed. Attempting REST direct call not supported. Please run migration directly in Supabase UI.");
        console.log(tErr);
    } else {
        console.log("Success");
    }
}

run();
