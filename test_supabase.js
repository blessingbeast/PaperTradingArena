const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("KEY HEAD:", process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20));
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        const { data, error } = await supabase.from('portfolios').select('id, user_id, balance').limit(5);
        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Supabase Success! Found", data?.length, "portfolios.");
        }
    } catch (e) {
        console.error("Crash:", e.message);
    }
}
test();
