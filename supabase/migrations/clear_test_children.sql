-- Script to clear test children data from your classes
-- This will show you all your classes and allow you to clear children data

-- Step 1: View all your classes and their IDs
-- Run this first to see your classes:
SELECT
  id,
  name,
  school_name,
  (SELECT COUNT(*) FROM children WHERE class_id = classes.id) as children_count
FROM classes
WHERE created_by = auth.uid();

-- Step 2: After you identify which class you want to clear,
-- uncomment the lines below and replace 'PASTE_CLASS_ID_HERE' with the actual ID from Step 1

-- Delete child-parent relationships
-- DELETE FROM child_parents
-- WHERE child_id IN (
--   SELECT id FROM children
--   WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid())
-- );

-- Delete parents for your classes
-- DELETE FROM parents
-- WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid());

-- Delete children from your classes
-- DELETE FROM children
-- WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid());


-- ALTERNATIVE: If you want to clear ALL children from ALL your classes at once:
-- Uncomment these lines:

-- DELETE FROM child_parents
-- WHERE child_id IN (
--   SELECT id FROM children
--   WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid())
-- );

-- DELETE FROM parents
-- WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid());

-- DELETE FROM children
-- WHERE class_id IN (SELECT id FROM classes WHERE created_by = auth.uid());
