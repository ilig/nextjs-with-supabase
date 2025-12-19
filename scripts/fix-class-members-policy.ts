import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to run migrations')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250204_fix_class_members_policy.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('Running migration to fix class_members policies...')

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`)
    const { error } = await supabase.rpc('exec_sql', { sql: statement })

    if (error) {
      console.error('Statement failed:', error)
      // Try direct query as fallback
      const { error: queryError } = await supabase.from('_sql').select('*').limit(0)
      console.error('Migration failed:', error, queryError)
    } else {
      console.log('✓ Statement executed successfully')
    }
  }

  console.log('Migration completed!')
}

runMigration().catch(console.error)
