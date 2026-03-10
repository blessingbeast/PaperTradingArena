import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
  const email = 'ashu.bisht.31105@gmail.com';
  
  console.log(`Setting admin role for ${email}...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Error updating user role:', error);
  } else if (data && data.length > 0) {
    console.log(`Success! Updated user:`, data[0].email, 'Role:', data[0].role);
  } else {
    console.log(`User with email ${email} not found in the users table.`);
  }
}

setAdmin();
