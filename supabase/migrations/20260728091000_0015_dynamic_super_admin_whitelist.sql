-- The old CHECK constraint hardcoded 3 emails and can't be edited from the
-- app (it was also missing liyahjoha@gmail.com, which would have blocked
-- that account from ever becoming super_admin). Replace it with a trigger
-- that checks the dynamic `super_admin_emails` table instead, so the
-- Super Admin panel's add/remove UI actually has effect at the DB level too.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_super_admin_whitelist;

CREATE OR REPLACE FUNCTION enforce_super_admin_whitelist()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'super_admin' AND NOT EXISTS (
    SELECT 1 FROM super_admin_emails WHERE email = NEW.email
  ) THEN
    RAISE EXCEPTION 'This email is not on the super admin whitelist.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_super_admin_whitelist ON profiles;
CREATE TRIGGER trg_enforce_super_admin_whitelist
  BEFORE INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_super_admin_whitelist();
