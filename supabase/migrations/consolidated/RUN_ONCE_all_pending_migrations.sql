-- =====================================================================
-- SCRIPT CONSOLIDE - 11 migrations en attente (0009 a 0019)
-- A executer UNE SEULE FOIS dans Supabase SQL Editor, du debut a la fin.
-- Genere le 2026-07-28. Chaque section est separee et commentee.
-- =====================================================================

-- ============================================================
-- FICHIER: 20260726090000_0009_add_reference_to_payments.sql
-- ============================================================
-- Add a reference/note field to payments so students can submit a manual
-- transfer reference (Mobile Money, bank transfer, etc.) while Paystack and
-- Cinetpay are not yet validated. Admins use this to match and confirm
-- manual payments before activating the subscription.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note text;

-- ============================================================
-- FICHIER: 20260726100000_0010_add_pending_payment_status.sql
-- ============================================================
-- Remove the free trial: students now choose a plan and must pay before
-- getting full access. New subscriptions start as 'pending_payment' until
-- an admin confirms the manual payment (Paystack/CinetPay not yet live),
-- at which point they become 'active'.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial', 'pending_payment', 'active', 'expired', 'cancelled'));

-- ============================================================
-- FICHIER: 20260726110000_0011_payout_requests.sql
-- ============================================================
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

-- ============================================================
-- FICHIER: 20260726120000_0012_super_admin_emails.sql
-- ============================================================
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

-- ============================================================
-- FICHIER: 20260726130000_0013_africa_salary_ranges.sql
-- ============================================================
-- The initial seed data used US salary ranges, which don't reflect the
-- African job market this platform serves. This corrects the existing rows
-- (an UPDATE, since the original INSERT used ON CONFLICT DO NOTHING and
-- won't touch rows already created).
UPDATE career_paths SET salary_range = '$6,000 - $30,000' WHERE slug = 'full-stack-web-developer';
UPDATE career_paths SET salary_range = '$8,000 - $40,000' WHERE slug = 'ai-engineer';
UPDATE career_paths SET salary_range = '$7,000 - $35,000' WHERE slug = 'cybersecurity';
UPDATE career_paths SET salary_range = '$5,000 - $25,000' WHERE slug = 'data-analyst';
UPDATE career_paths SET salary_range = '$5,000 - $28,000' WHERE slug = 'ui-ux-designer';
UPDATE career_paths SET salary_range = '$6,000 - $32,000' WHERE slug = 'mobile-app-developer';
UPDATE career_paths SET salary_range = '$4,000 - $18,000' WHERE slug = 'accounting';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'digital-marketing';
UPDATE career_paths SET salary_range = '$4,000 - $22,000' WHERE slug = 'sales-crm';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'e-commerce';
UPDATE career_paths SET salary_range = '$2,500 - $15,000' WHERE slug = 'professional-makeup-artist';
UPDATE career_paths SET salary_range = '$2,000 - $12,000' WHERE slug = 'hair-stylist';
UPDATE career_paths SET salary_range = '$1,800 - $10,000' WHERE slug = 'nail-technician';
UPDATE career_paths SET salary_range = '$2,000 - $12,000' WHERE slug = 'barber';
UPDATE career_paths SET salary_range = '$3,000 - $18,000' WHERE slug = 'fashion-designer';
UPDATE career_paths SET salary_range = '$3,500 - $18,000' WHERE slug = 'graphic-design';
UPDATE career_paths SET salary_range = '$3,000 - $16,000' WHERE slug = 'video-editing';
UPDATE career_paths SET salary_range = '$2,500 - $15,000' WHERE slug = 'photography';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'motion-graphics';
UPDATE career_paths SET salary_range = '$3,000 - $14,000' WHERE slug = 'electrical-installation';
UPDATE career_paths SET salary_range = '$3,000 - $13,000' WHERE slug = 'plumbing';
UPDATE career_paths SET salary_range = '$3,000 - $14,000' WHERE slug = 'air-conditioning';
UPDATE career_paths SET salary_range = '$2,500 - $12,000' WHERE slug = 'computer-repair';

-- ============================================================
-- FICHIER: 20260728090000_0014_fix_subscription_plan_constraint.sql
-- ============================================================
-- Critical fix: the pricing page offers 4 plans (starter, professional,
-- expert, bundle) but this constraint only allowed ('starter','premium',
-- 'enterprise'). Signing up for professional/expert/bundle was silently
-- failing at the database level. Align the constraint with the real plans.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('starter', 'professional', 'expert', 'bundle'));

-- ============================================================
-- FICHIER: 20260728091000_0015_dynamic_super_admin_whitelist.sql
-- ============================================================
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

-- ============================================================
-- FICHIER: 20260728100000_0016_enforce_lesson_access_server_side.sql
-- ============================================================
-- Server-side enforcement of the lesson preview lock. Until now, only the
-- first lesson of each course was meant to be accessible before payment
-- confirmation, but that rule was enforced in the UI only — a direct API
-- call could mark any lesson as completed regardless of payment status.
-- This trigger makes the rule impossible to bypass, at the database level.
CREATE OR REPLACE FUNCTION enforce_lesson_access()
RETURNS trigger AS $$
DECLARE
  lesson_course_id uuid;
  lesson_order int;
  min_order int;
  has_subscription boolean;
  is_active_subscriber boolean;
BEGIN
  -- Only gate when a lesson is actually being marked completed.
  IF NEW.completed IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT course_id, order_number INTO lesson_course_id, lesson_order
  FROM lessons WHERE id = NEW.lesson_id;

  -- Must be enrolled in the course this lesson belongs to.
  IF NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = NEW.user_id AND course_id = lesson_course_id
  ) THEN
    RAISE EXCEPTION 'You must be enrolled in this course to track progress.';
  END IF;

  SELECT MIN(order_number) INTO min_order FROM lessons WHERE course_id = lesson_course_id;

  -- The first lesson of any course is always a free preview.
  IF lesson_order = min_order THEN
    RETURN NEW;
  END IF;

  -- Beyond the first lesson, an active (paid) subscription is required.
  -- Users with no subscription row at all (trainers, admins) are not
  -- students and are not gated by this rule.
  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = NEW.user_id) INTO has_subscription;
  IF NOT has_subscription THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.user_id AND status = 'active'
  ) INTO is_active_subscriber;

  IF NOT is_active_subscriber THEN
    RAISE EXCEPTION 'Confirm your payment to unlock this lesson.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_lesson_access ON progress;
CREATE TRIGGER trg_enforce_lesson_access
  BEFORE INSERT OR UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION enforce_lesson_access();

-- ============================================================
-- FICHIER: 20260728101000_0017_lessons_gated_view.sql
-- ============================================================
-- CRITICAL FIX: the "read_lessons" policy exposes full lesson rows —
-- including video_url and document_url — to ANY visitor (even anonymous,
-- unauthenticated ones) for any published course. This means the actual
-- paid video content could be fetched directly via the API, bypassing the
-- app entirely, regardless of enrollment or payment status.
--
-- This view keeps lesson metadata visible (title, order, duration) so the
-- course page can still list every lesson, but replaces video_url and
-- document_url with empty strings unless the requesting user is actually
-- allowed to access that lesson's content:
--   - the course's creator (trainer previewing/editing their own course), or
--   - a user enrolled in the course AND (it's the free first lesson OR
--     they have an active, paid subscription, OR they have no subscription
--     row at all — i.e. they aren't a gated student, e.g. an admin).
CREATE OR REPLACE VIEW lessons_gated
WITH (security_invoker = true) AS
SELECT
  l.id,
  l.course_id,
  l.title,
  CASE WHEN (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = l.course_id AND c.created_by = auth.uid())
    OR (
      EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.course_id = l.course_id)
      AND (
        l.order_number = (SELECT MIN(l2.order_number) FROM lessons l2 WHERE l2.course_id = l.course_id)
        OR NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = auth.uid() AND s.status = 'active')
      )
    )
  ) THEN l.video_url ELSE '' END AS video_url,
  CASE WHEN (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = l.course_id AND c.created_by = auth.uid())
    OR (
      EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.course_id = l.course_id)
      AND (
        l.order_number = (SELECT MIN(l2.order_number) FROM lessons l2 WHERE l2.course_id = l.course_id)
        OR NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = auth.uid() AND s.status = 'active')
      )
    )
  ) THEN l.document_url ELSE '' END AS document_url,
  l.duration,
  l.order_number,
  l.created_at
FROM lessons l;

GRANT SELECT ON lessons_gated TO anon, authenticated;

-- ============================================================
-- FICHIER: 20260728102000_0018_private_course_videos_bucket.sql
-- ============================================================
-- CRITICAL FIX: 'course-videos' was a PUBLIC bucket, meaning any uploaded
-- lesson video had a permanent, unauthenticated public URL — once known,
-- that URL worked forever for anyone, completely bypassing enrollment and
-- payment checks (and the lessons_gated view built to mask it).
--
-- Make the bucket private. Access now requires generating a short-lived
-- signed URL (see lib/upload.ts: getPrivateFileUrl), which itself requires
-- the caller to be authenticated. The real defense in depth is that the
-- file path is only ever revealed to authorized users via the
-- `lessons_gated` view (see migration 0017) — an unauthorized user never
-- learns the path needed to request a signed URL in the first place.
UPDATE storage.buckets SET public = false WHERE id = 'course-videos';

DROP POLICY IF EXISTS "read_course_videos" ON storage.objects;
CREATE POLICY "read_course_videos" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'course-videos');

-- ============================================================
-- FICHIER: 20260728103000_0019_fix_legacy_video_urls_to_paths.sql
-- ============================================================
-- Any lessons uploaded before the previous migration have video_url/
-- document_url stored as a full public URL (e.g.
-- ".../storage/v1/object/public/course-videos/<path>") rather than a bare
-- path. Since the bucket is now private, these need to be the relative
-- path only, so getPrivateFileUrl() can generate a working signed URL.
UPDATE lessons
SET video_url = regexp_replace(video_url, '^.*course-videos/', '')
WHERE video_url LIKE 'http%course-videos/%';

UPDATE lessons
SET document_url = regexp_replace(document_url, '^.*course-videos/', '')
WHERE document_url LIKE 'http%course-videos/%';

