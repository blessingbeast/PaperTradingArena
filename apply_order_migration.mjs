import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20240310_order_fo_schema.sql', 'utf8');
    console.log('Executing F&O Order Schema migration via execute_sql RPC...');
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: sql });

    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration executed successfully:', data);
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

runMigration();
