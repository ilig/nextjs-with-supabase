-- Add optional phone column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN staff.phone IS 'Optional phone number for staff member';
