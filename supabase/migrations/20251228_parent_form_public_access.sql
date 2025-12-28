-- Parent Form Public Access Policies
-- Allows parents to access and update child data via class invite code

-- =====================================================
-- 1. ALLOW PUBLIC READ ACCESS TO CLASSES BY INVITE CODE
-- =====================================================
DROP POLICY IF EXISTS "Public can view class by invite code" ON classes;

CREATE POLICY "Public can view class by invite code"
  ON classes FOR SELECT
  USING (invite_code IS NOT NULL);

-- =====================================================
-- 2. ALLOW PUBLIC READ ACCESS TO CHILDREN IN CLASS
-- =====================================================
DROP POLICY IF EXISTS "Public can view children by class invite code" ON children;

CREATE POLICY "Public can view children by class invite code"
  ON children FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE invite_code IS NOT NULL
    )
  );

-- =====================================================
-- 3. ALLOW PUBLIC UPDATE TO CHILDREN
-- =====================================================
DROP POLICY IF EXISTS "Public can update children by class invite code" ON children;

CREATE POLICY "Public can update children by class invite code"
  ON children FOR UPDATE
  USING (
    class_id IN (
      SELECT id FROM classes WHERE invite_code IS NOT NULL
    )
  );

-- =====================================================
-- 4. ALLOW PUBLIC ACCESS TO PARENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Public can insert parents" ON parents;

CREATE POLICY "Public can insert parents"
  ON parents FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view parents by class" ON parents;

CREATE POLICY "Public can view parents by class"
  ON parents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can update parents" ON parents;

CREATE POLICY "Public can update parents"
  ON parents FOR UPDATE
  USING (true);

-- =====================================================
-- 5. ALLOW PUBLIC ACCESS TO CHILD_PARENTS JUNCTION
-- =====================================================
DROP POLICY IF EXISTS "Public can insert child_parents" ON child_parents;

CREATE POLICY "Public can insert child_parents"
  ON child_parents FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view child_parents" ON child_parents;

CREATE POLICY "Public can view child_parents"
  ON child_parents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can update child_parents" ON child_parents;

CREATE POLICY "Public can update child_parents"
  ON child_parents FOR UPDATE
  USING (true);
