-- V2 Schema Updates Migration
-- This adds the new columns required for ClassEase V2

-- =====================================================
-- 1. CLASSES TABLE - New Columns
-- =====================================================
ALTER TABLE classes ADD COLUMN IF NOT EXISTS settlement TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS annual_amount_per_child DECIMAL(10,2);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS estimated_children INTEGER;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS estimated_staff INTEGER;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS paybox_link TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 2. EVENTS TABLE - New Columns
-- =====================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount_per_kid DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount_per_staff DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS allocated_for_kids DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS allocated_for_staff DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS kids_count INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS staff_count INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- =====================================================
-- 3. CHILDREN TABLE - New Columns
-- =====================================================
-- Check if payment_status column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE children ADD COLUMN payment_status TEXT
      CHECK (payment_status IN ('paid', 'unpaid')) DEFAULT 'unpaid';
  END IF;
END $$;

ALTER TABLE children ADD COLUMN IF NOT EXISTS payment_date DATE;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- V2 columns have been added to all required tables
