-- Fix parents table to support class-based parent management
-- This migration adds class_id to parents and updates RLS policies

-- Add class_id column to parents table
ALTER TABLE parents ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_parents_class_id ON parents(class_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Parents can view their own data" ON parents;
DROP POLICY IF EXISTS "Users can create parent records" ON parents;

-- Create new RLS policies that support both parent users and class admins

-- Policy 1: Parents can view their own data (if they have a user_id)
CREATE POLICY "Parents can view their own data"
  ON parents FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Class admins can view parents in their classes
CREATE POLICY "Class admins can view parents in their classes"
  ON parents FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- Policy 3: Parents can create/update their own records
CREATE POLICY "Parents can manage their own records"
  ON parents FOR ALL
  USING (user_id = auth.uid());

-- Policy 4: Class admins can create/update parents in their classes
CREATE POLICY "Class admins can manage parents in their classes"
  ON parents FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );
