-- =====================================================
-- ADMIN INVITATIONS TABLE
-- Stores pending admin invitations by email
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(class_id, email)
);

-- Enable RLS
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view invitations for their classes"
  ON admin_invitations FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
    OR class_id IN (
      SELECT cm.class_id FROM class_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invitations for their classes"
  ON admin_invitations FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
    OR class_id IN (
      SELECT cm.class_id FROM class_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations for their classes"
  ON admin_invitations FOR DELETE
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
    OR class_id IN (
      SELECT cm.class_id FROM class_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_invitations_class_id ON admin_invitations(class_id);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);
