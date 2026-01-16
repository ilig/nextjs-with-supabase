-- Add directory_settings column to classes table
-- This JSONB column stores visibility settings for the public directory

ALTER TABLE classes ADD COLUMN IF NOT EXISTS directory_settings JSONB DEFAULT '{
  "show_phone": true,
  "show_address": true,
  "show_birthday": true,
  "is_public": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN classes.directory_settings IS 'JSON settings for public directory visibility: show_phone, show_address, show_birthday, is_public';
