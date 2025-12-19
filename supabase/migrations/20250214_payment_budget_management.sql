-- Migration: Payment & Budget Management Feature
-- Date: 2025-02-14
-- Description: Adds payment rounds, expenses tracking, and updates payments table

-- ============================================
-- 1. CREATE PAYMENT ROUNDS TABLE (גיוסים)
-- ============================================
-- Payment rounds represent collection campaigns (e.g., "תשלום שנתי", "גיוס לטיול")
-- Each round has a target amount per child and optional due date

CREATE TABLE IF NOT EXISTS payment_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- e.g., "תשלום שנתי", "גיוס לטיול"
  amount_per_child DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by class
CREATE INDEX IF NOT EXISTS idx_payment_rounds_class_id ON payment_rounds(class_id);

-- Enable RLS
ALTER TABLE payment_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_rounds
CREATE POLICY "Users can view payment rounds in their classes"
  ON payment_rounds FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment rounds in their classes"
  ON payment_rounds FOR ALL
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. CREATE EXPENSES TABLE (הוצאות)
-- ============================================
-- Track all expenses with optional link to events

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,  -- optional link to event
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,  -- URL to uploaded receipt image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_class_id ON expenses(class_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their classes"
  ON expenses FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage expenses in their classes"
  ON expenses FOR ALL
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT class_id FROM class_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. UPDATE PAYMENTS TABLE
-- ============================================
-- Add payment_round_id and child_id columns
-- Change from parent-based to child-based payments

-- Add payment_round_id column
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_round_id UUID REFERENCES payment_rounds(id) ON DELETE CASCADE;

-- Add child_id column (payment is per child, not per parent)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_payment_round_id ON payments(payment_round_id);
CREATE INDEX IF NOT EXISTS idx_payments_child_id ON payments(child_id);

-- Update status constraint to simplified values (paid/unpaid only)
-- First, update existing data to new status values
UPDATE payments SET status = 'paid' WHERE status IN ('completed', 'pending');
UPDATE payments SET status = 'unpaid' WHERE status IN ('failed', 'refunded');

-- Drop the old constraint and add new one
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('paid', 'unpaid'));

-- Set default status to 'unpaid' for new payments
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'unpaid';

-- Drop the payment_method constraint (we'll always use Paybox)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

-- ============================================
-- 4. CREATE HELPER VIEWS
-- ============================================

-- View: Payment summary per round
CREATE OR REPLACE VIEW payment_round_summary AS
SELECT
  pr.id AS payment_round_id,
  pr.class_id,
  pr.name,
  pr.amount_per_child,
  pr.due_date,
  COUNT(DISTINCT c.id) AS total_children,
  COUNT(DISTINCT CASE WHEN p.status = 'paid' THEN p.child_id END) AS paid_children,
  COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_collected,
  (pr.amount_per_child * COUNT(DISTINCT c.id)) AS expected_total
FROM payment_rounds pr
LEFT JOIN children c ON c.class_id = pr.class_id
LEFT JOIN payments p ON p.payment_round_id = pr.id AND p.child_id = c.id
GROUP BY pr.id, pr.class_id, pr.name, pr.amount_per_child, pr.due_date;

-- View: Budget summary per class
CREATE OR REPLACE VIEW class_budget_summary AS
SELECT
  cl.id AS class_id,
  COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_collected,
  COALESCE((SELECT SUM(amount) FROM expenses WHERE class_id = cl.id), 0) AS total_spent,
  COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) -
    COALESCE((SELECT SUM(amount) FROM expenses WHERE class_id = cl.id), 0) AS balance
FROM classes cl
LEFT JOIN payments p ON p.class_id = cl.id
GROUP BY cl.id;

-- ============================================
-- 5. UPDATE TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
DROP TRIGGER IF EXISTS update_payment_rounds_updated_at ON payment_rounds;
CREATE TRIGGER update_payment_rounds_updated_at
  BEFORE UPDATE ON payment_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. GRANT PERMISSIONS ON VIEWS
-- ============================================

-- Enable RLS on views (they inherit from base tables)
-- Note: Views automatically respect the RLS policies of underlying tables
