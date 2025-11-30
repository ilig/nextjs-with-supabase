# Supabase Database Setup Instructions

## Quick Setup (3 Steps)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
1. Open the file: `supabase/migrations/20250124_create_classease_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify Tables Created
1. Go to **Table Editor** in the left sidebar
2. You should see 7 new tables:
   - ✅ `classes`
   - ✅ `children`
   - ✅ `parents`
   - ✅ `child_parents`
   - ✅ `staff`
   - ✅ `events`
   - ✅ `class_members`

## What This Migration Does

### Tables Created:
- **classes** - Stores class information with auto-generated invite codes
- **children** - Student records linked to classes
- **parents** - Parent contact information
- **child_parents** - Links children to their parents (supports 2 parents per child)
- **staff** - Teachers and assistants with birthdays
- **events** - Class events with budget tracking
- **class_members** - Manages user access to classes (admin/parent/viewer roles)

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own classes
- ✅ Policies enforce data isolation between classes
- ✅ Proper CASCADE deletes to maintain referential integrity

### Performance:
- ✅ Indexes on frequently queried columns
- ✅ Foreign key relationships for data consistency
- ✅ Optimized for dashboard queries

## Troubleshooting

### Error: "extension uuid-ossp does not exist"
Run this first in SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "relation already exists"
Tables already created! You're good to go.

### Error: "permission denied"
Make sure you're running the SQL as the database owner/admin.

## Next Steps

After running the migration:

1. **Test the Onboarding Flow**
   - Go to `/create-class`
   - Fill out the wizard
   - Submit to create your first class

2. **View Your Dashboard**
   - After onboarding, you'll be redirected to `/dashboard`
   - See all your class data, budget metrics, and member lists

3. **Invite Parents**
   - Copy the invite link from the dashboard
   - Share it with parents in your class
   - They can join using the unique invite code

## Database Schema Diagram

```
classes (main entity)
  ├── children
  │   └── child_parents → parents
  ├── staff
  ├── events
  └── class_members → auth.users
```

All tables cascade delete when a class is deleted, ensuring clean data removal.
