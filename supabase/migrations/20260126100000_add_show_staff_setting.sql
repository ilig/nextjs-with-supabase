-- Add show_staff to directory_settings for existing classes
-- Update existing classes to have show_staff: true in their directory_settings

UPDATE classes
SET directory_settings = directory_settings || '{"show_staff": true}'::jsonb
WHERE directory_settings IS NOT NULL
  AND NOT (directory_settings ? 'show_staff');

-- Update the default value for new classes
COMMENT ON COLUMN classes.directory_settings IS 'JSON settings for public directory visibility: show_phone, show_address, show_birthday, show_staff, is_public';
