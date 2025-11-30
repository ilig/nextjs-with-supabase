-- Add birthday column to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS birthday DATE;
