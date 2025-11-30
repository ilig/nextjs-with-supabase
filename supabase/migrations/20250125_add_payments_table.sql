-- Add Payments Table for Tracking Parent Payments
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view payments for their classes"
  ON payments FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their classes"
  ON payments FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their classes"
  ON payments FOR UPDATE
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their classes"
  ON payments FOR DELETE
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_class_id ON payments(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add expected_payment_per_parent to classes table (optional but useful)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS expected_payment_per_parent DECIMAL(10, 2);

COMMENT ON TABLE payments IS 'Tracks parent payments for class expenses';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment: cash, bank_transfer, credit_card, check, other';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded';
