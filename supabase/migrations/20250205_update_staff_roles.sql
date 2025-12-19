-- Update staff table to support additional role types
-- This migration adds 'kindergarten_teacher' and 'other' to the allowed role values

-- Drop the existing constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- Add the updated constraint with new role values
ALTER TABLE staff ADD CONSTRAINT staff_role_check
  CHECK (role IN ('teacher', 'kindergarten_teacher', 'assistant', 'other'));

-- Add a comment to document the role values
COMMENT ON COLUMN staff.role IS 'Staff role: teacher (מורה), kindergarten_teacher (גננת), assistant (סייע/ת), or other (אחר)';
