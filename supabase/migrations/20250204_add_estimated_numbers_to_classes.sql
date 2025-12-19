-- Add estimated number of children and staff to classes table
-- This allows the wizard to save size estimates during onboarding

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS number_of_children INTEGER,
ADD COLUMN IF NOT EXISTS number_of_staff INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN classes.number_of_children IS 'Estimated or actual number of children in the class';
COMMENT ON COLUMN classes.number_of_staff IS 'Estimated or actual number of staff members (teachers, assistants)';
