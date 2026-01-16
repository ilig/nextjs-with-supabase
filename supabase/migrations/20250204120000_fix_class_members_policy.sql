-- Fix infinite recursion in class_members policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage class members" ON class_members;

-- Create separate policies for INSERT and UPDATE/DELETE
-- Allow class creators to add members (for initial admin member creation)
CREATE POLICY "Class creators can add members"
  ON class_members FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- Allow admins to update/delete members (checks existing membership without recursion)
CREATE POLICY "Admins can update class members"
  ON class_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = class_members.class_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete class members"
  ON class_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = class_members.class_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );
