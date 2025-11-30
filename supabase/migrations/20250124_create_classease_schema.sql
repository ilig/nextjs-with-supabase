-- ClassEase Database Schema Migration
-- Run this in your Supabase SQL Editor to create all required tables

-- =====================================================
-- 1. CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  city TEXT NOT NULL,
  year TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  invite_code TEXT UNIQUE,
  total_budget DECIMAL(10, 2),
  budget_type TEXT CHECK (budget_type IN ('per-child', 'total')),
  budget_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own classes"
  ON classes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create classes"
  ON classes FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own classes"
  ON classes FOR UPDATE
  USING (created_by = auth.uid());

-- =====================================================
-- 2. CHILDREN TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view children in their classes"
  ON children FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage children in their classes"
  ON children FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 3. PARENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Parents can view their own data"
  ON parents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create parent records"
  ON parents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. CHILD_PARENTS JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS child_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('parent1', 'parent2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, parent_id)
);

-- Enable RLS
ALTER TABLE child_parents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view parent-child relationships in their classes"
  ON child_parents FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      INNER JOIN classes cl ON c.class_id = cl.id
      WHERE cl.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage parent-child relationships in their classes"
  ON child_parents FOR ALL
  USING (
    child_id IN (
      SELECT c.id FROM children c
      INNER JOIN classes cl ON c.class_id = cl.id
      WHERE cl.created_by = auth.uid()
    )
  );

-- =====================================================
-- 5. STAFF TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'assistant')),
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view staff in their classes"
  ON staff FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage staff in their classes"
  ON staff FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 6. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  icon TEXT,
  allocated_budget DECIMAL(10, 2),
  spent_amount DECIMAL(10, 2) DEFAULT 0,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view events in their classes"
  ON events FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage events in their classes"
  ON events FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 7. CLASS_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS class_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'parent', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view members in their classes"
  ON class_members FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can manage class members"
  ON class_members FOR ALL
  USING (
    class_id IN (
      SELECT cm.class_id FROM class_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to generate random invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN lower(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate invite code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set invite code on class creation
CREATE TRIGGER set_class_invite_code
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON classes(created_by);
CREATE INDEX IF NOT EXISTS idx_children_class_id ON children(class_id);
CREATE INDEX IF NOT EXISTS idx_staff_class_id ON staff(class_id);
CREATE INDEX IF NOT EXISTS idx_events_class_id ON events(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_child_parents_child_id ON child_parents(child_id);
CREATE INDEX IF NOT EXISTS idx_child_parents_parent_id ON child_parents(parent_id);
CREATE INDEX IF NOT EXISTS idx_classes_invite_code ON classes(invite_code);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables, policies, and functions have been created
-- You can now use the ClassEase application!
