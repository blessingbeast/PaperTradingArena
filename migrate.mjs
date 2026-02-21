import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htbbpschkbwcssjtijxa.supabase.co';
const supabaseKey = 'sb_publishable_xSFKKA2XhnmIBwhQywl7Yw_cyC7J4vF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const r1 = await supabase.from('watchlists').update({ symbol: 'TMPV' }).eq('symbol', 'TATAMOTORS');
        console.log('watchlists TATAMOTORS -> TMPV:', r1.error || 'SUCCESS');

        const r2 = await supabase.from('watchlists').delete().eq('symbol', 'TATAMTRDVR');
        console.log('watchlists TATAMTRDVR -> DELETE:', r2.error || 'SUCCESS');

        const r3 = await supabase.from('positions').update({ symbol: 'TMPV' }).in('symbol', ['TATAMOTORS', 'TATAMTRDVR']);
        console.log('positions -> TMPV:', r3.error || 'SUCCESS');

        const r4 = await supabase.from('trades').update({ symbol: 'TMPV' }).in('symbol', ['TATAMOTORS', 'TATAMTRDVR']);
        console.log('trades -> TMPV:', r4.error || 'SUCCESS');

    } catch (e) {
        console.error('Error running migration', e);
    }
}
run();
