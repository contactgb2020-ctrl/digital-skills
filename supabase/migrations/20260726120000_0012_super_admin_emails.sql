-- Whitelist of emails allowed to hold the super_admin role, editable from
-- the Super Admin panel itself (add / remove). The two founding emails are
-- protected and can never be removed through the app.
CREATE TABLE IF NOT EXISTS super_admin_emails (
  email text PRIMARY KEY,
  protected boolean NOT NULL DEFAULT false,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO super_admin_emails (email, protected) VALUES
  ('vincentnogue2@gmail.com', false),
  ('vincentnogue@yahoo.com', false),
  ('liyahjoha@gmail.com', true),
  ('webdxb1@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

ALTER TABLE super_admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_read_emails" ON super_admin_emails;
CREATE POLICY "super_admin_read_emails" ON super_admin_emails FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_insert_emails" ON super_admin_emails;
CREATE POLICY "super_admin_insert_emails" ON super_admin_emails FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_delete_emails" ON super_admin_emails;
CREATE POLICY "super_admin_delete_emails" ON super_admin_emails FOR DELETE
  TO authenticated USING (
    protected = false
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- Belt-and-suspenders: even a direct SQL delete cannot remove a protected row.
CREATE OR REPLACE FUNCTION prevent_protected_super_admin_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.protected THEN
    RAISE EXCEPTION 'This super admin email is protected and cannot be removed.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_protected_super_admin_delete ON super_admin_emails;
CREATE TRIGGER trg_prevent_protected_super_admin_delete
  BEFORE DELETE ON super_admin_emails
  FOR EACH ROW EXECUTE FUNCTION prevent_protected_super_admin_delete();
