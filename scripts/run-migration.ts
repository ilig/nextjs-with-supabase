import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  const sql = `ALTER TABLE children ADD COLUMN IF NOT EXISTS birthday DATE;`

  console.log('Running migration...')
  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  console.log('Migration completed successfully!')
}

runMigration()
