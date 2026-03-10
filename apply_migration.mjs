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
    const sql = fs.readFileSync('supabase/migrations/20240307_admin_panel_setup.sql', 'utf8');
    console.log('Executing migration via execute_sql RPC...');
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: sql });

    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration executed successfully:', data);
      
      // Now set the admin role
      const email = 'ashu.bisht.31105@gmail.com';
      console.log(`Setting admin role for ${email}...`);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

      if (userError) {
        console.error('Error updating user role:', userError);
      } else if (userData && userData.length > 0) {
        console.log(`Success! Updated user:`, userData[0].email, 'Role:', userData[0].role);
      } else {
        console.log(`User with email ${email} not found in the users table.`);
      }
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

runMigration();
