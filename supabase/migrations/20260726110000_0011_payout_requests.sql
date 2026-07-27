-- Trainer payout requests: trainers submit their Mobile Money / bank details
-- and request a withdrawal of their available (paid) earnings. An admin
-- processes the request manually and marks it as paid or rejected.
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL CHECK (method IN ('mobile_money', 'bank_transfer')),
  account_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_trainer ON payout_requests(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_select_own_payout_requests" ON payout_requests;
CREATE POLICY "trainer_select_own_payout_requests" ON payout_requests FOR SELECT
  TO authenticated USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "trainer_insert_own_payout_requests" ON payout_requests;
CREATE POLICY "trainer_insert_own_payout_requests" ON payout_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "superadmin_read_all_payout_requests" ON payout_requests;
CREATE POLICY "superadmin_read_all_payout_requests" ON payout_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_update_payout_requests" ON payout_requests;
CREATE POLICY "superadmin_update_payout_requests" ON payout_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );
