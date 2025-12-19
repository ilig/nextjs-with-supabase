// Script to delete a user from Supabase
// Usage: node scripts/delete-user.js <email>

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email) {
  console.log(`\n🔍 Looking for user: ${email}`);

  try {
    // 1. Find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }

    console.log(`✅ Found user:`, {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    });

    // 2. Delete associated data first (to avoid orphaned records)
    console.log('\n🗑️  Deleting associated data...');

    // Delete classes created by user
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('created_by', user.id);

    if (classesError) {
      console.error('⚠️  Error fetching classes:', classesError.message);
    } else if (classes && classes.length > 0) {
      console.log(`   Found ${classes.length} class(es):`);
      classes.forEach(c => console.log(`   - ${c.name} (${c.id})`));

      // Delete classes (cascade should handle children, staff, events, etc.)
      const { error: deleteClassesError } = await supabase
        .from('classes')
        .delete()
        .eq('created_by', user.id);

      if (deleteClassesError) {
        console.error('❌ Error deleting classes:', deleteClassesError.message);
      } else {
        console.log(`   ✅ Deleted ${classes.length} class(es) and associated data`);
      }
    } else {
      console.log('   No classes found for this user');
    }

    // Delete class memberships
    const { error: membershipsError } = await supabase
      .from('class_members')
      .delete()
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('⚠️  Error deleting class memberships:', membershipsError.message);
    } else {
      console.log('   ✅ Deleted class memberships');
    }

    // Delete user onboarding data
    const { error: onboardingError } = await supabase
      .from('user_onboarding')
      .delete()
      .eq('user_id', user.id);

    if (onboardingError) {
      console.error('⚠️  Error deleting onboarding data:', onboardingError.message);
    } else {
      console.log('   ✅ Deleted onboarding data');
    }

    // 3. Delete the auth user
    console.log('\n🗑️  Deleting auth user...');
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('❌ Error deleting auth user:', deleteUserError.message);
      return;
    }

    console.log('✅ Successfully deleted auth user');
    console.log('\n✨ User deletion complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/delete-user.js <email>');
  process.exit(1);
}

// Run the deletion
deleteUser(email).then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
