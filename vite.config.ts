/*
# KYC, Categories, Commissions, Custom Roles, Super Admin Security

## Overview
Adds the full LIYAH GROUP feature set: KYC verification, course categories,
watch session tracking + trainer commissions, custom staff roles,
super admin email whitelist, and minimum-2-admins guard.

## New Tables
- kyc_documents: identity verification uploads
- categories: course categories managed by Super Admin
- watch_sessions: viewing time tracking per lesson
- trainer_earnings: aggregated 1$/hour commission per trainer
- custom_roles: custom staff roles (Moderator, Support, etc.)
- role_permissions: granular permissions per custom role
- staff_members: assigns custom role to a user

## Modified Tables
- profiles: + kyc_status, document_type, document_url columns + super_admin whitelist CHECK
- courses: + category_id FK to categories

## Security
- RLS on all new tables
- Super admin email whitelist enforced at DB level
- Trigger prevents demoting/deleting super_admin if < 2 would remain
- Super admin policies use EXISTS subquery on profiles.role
*/

-- ============ KYC DOCUMENTS ============
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'national_id',
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_documents(status);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_kyc" ON kyc_documents;
CREATE POLICY "select_own_kyc" ON kyc_documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_kyc" ON kyc_documents;
CREATE POLICY "insert_own_kyc" ON kyc_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "superadmin_read_all_kyc" ON kyc_documents;
CREATE POLICY "superadmin_read_all_kyc" ON kyc_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_update_kyc" ON kyc_documents;
CREATE POLICY "superadmin_update_kyc" ON kyc_documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT 'BookOpen',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_categories" ON categories;
CREATE POLICY "read_all_categories" ON categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "superadmin_insert_categories" ON categories;
CREATE POLICY "superadmin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_update_categories" ON categories;
CREATE POLICY "superadmin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_delete_categories" ON categories;
CREATE POLICY "superadmin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

INSERT INTO categories (name, slug, icon) VALUES
  ('Développement web & mobile', 'developpement-web-mobile', 'Code'),
  ('Marketing digital', 'marketing-digital', 'Megaphone'),
  ('Data & IA', 'data-ia', 'BrainCircuit'),
  ('Design graphique', 'design-graphique', 'Palette'),
  ('Bureautique & productivité', 'bureautique-productivite', 'FileSpreadsheet'),
  ('Beauté & Style', 'beaute-style', 'Sparkles'),
  ('Business & Entrepreneuriat', 'business-entrepreneuriat', 'Briefcase'),
  ('Photographie & Vidéo', 'photographie-video', 'Camera')
ON CONFLICT (name) DO NOTHING;

-- ============ COURSES: add category_id ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category_id') THEN
    ALTER TABLE courses ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============ PROFILES: add KYC columns ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_status') THEN
    ALTER TABLE profiles ADD COLUMN kyc_status text NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_type') THEN
    ALTER TABLE profiles ADD COLUMN document_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_url') THEN
    ALTER TABLE profiles ADD COLUMN document_url text;
  END IF;
END $$;

-- ============ SUPER ADMIN EMAIL WHITELIST ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_super_admin_whitelist'
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_super_admin_whitelist CHECK (
      role <> 'super_admin' OR email IN (
        'vincentnogue2@gmail.com',
        'vincentnogue@yahoo.com',
        'webdxb1@gmail.com'
      )
    );
  END IF;
END $$;

-- ============ WATCH SESSIONS ============
CREATE TABLE IF NOT EXISTS watch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tenant_id uuid,
  watched_seconds int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watch_user ON watch_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_course ON watch_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_watch_lesson ON watch_sessions(lesson_id);

ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_watch" ON watch_sessions;
CREATE POLICY "select_own_watch" ON watch_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watch" ON watch_sessions;
CREATE POLICY "insert_own_watch" ON watch_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "superadmin_read_all_watch" ON watch_sessions;
CREATE POLICY "superadmin_read_all_watch" ON watch_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ TRAINER EARNINGS ============
CREATE TABLE IF NOT EXISTS trainer_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_watch_hours numeric(10,2) NOT NULL DEFAULT 0,
  amount_due numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (trainer_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_earnings_trainer ON trainer_earnings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON trainer_earnings(status);

ALTER TABLE trainer_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_earnings" ON trainer_earnings;
CREATE POLICY "select_own_earnings" ON trainer_earnings FOR SELECT
  TO authenticated USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "superadmin_read_all_earnings" ON trainer_earnings;
CREATE POLICY "superadmin_read_all_earnings" ON trainer_earnings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_update_earnings" ON trainer_earnings;
CREATE POLICY "superadmin_update_earnings" ON trainer_earnings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ CUSTOM ROLES ============
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tenant_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_custom_roles" ON custom_roles;
CREATE POLICY "read_all_custom_roles" ON custom_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "superadmin_insert_custom_roles" ON custom_roles;
CREATE POLICY "superadmin_insert_custom_roles" ON custom_roles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_update_custom_roles" ON custom_roles;
CREATE POLICY "superadmin_update_custom_roles" ON custom_roles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

DROP POLICY IF EXISTS "superadmin_delete_custom_roles" ON custom_roles;
CREATE POLICY "superadmin_delete_custom_roles" ON custom_roles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ ROLE PERMISSIONS ============
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (role_id, permission_key)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_role_permissions" ON role_permissions;
CREATE POLICY "read_all_role_permissions" ON role_permissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "superadmin_write_role_permissions" ON role_permissions;
CREATE POLICY "superadmin_write_role_permissions" ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ STAFF MEMBERS ============
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id uuid NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, custom_role_id)
);

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_staff_members" ON staff_members;
CREATE POLICY "read_all_staff_members" ON staff_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "superadmin_write_staff_members" ON staff_members;
CREATE POLICY "superadmin_write_staff_members" ON staff_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============ MINIMUM 2 SUPER ADMINS GUARD ============
CREATE OR REPLACE FUNCTION prevent_last_super_admin_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count int;
BEGIN
  IF OLD.role = 'super_admin' AND NEW.role <> 'super_admin' THEN
    SELECT COUNT(*) INTO super_admin_count FROM profiles WHERE role = 'super_admin';
    IF super_admin_count <= 2 THEN
      RAISE EXCEPTION 'Impossible : il doit rester au moins deux Super Admins actifs.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_update ON profiles;
CREATE TRIGGER trg_prevent_last_super_admin_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_super_admin_update();

CREATE OR REPLACE FUNCTION prevent_last_super_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count int;
BEGIN
  IF OLD.role = 'super_admin' THEN
    SELECT COUNT(*) INTO super_admin_count FROM profiles WHERE role = 'super_admin';
    IF super_admin_count <= 2 THEN
      RAISE EXCEPTION 'Impossible : il doit rester au moins deux Super Admins actifs.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_delete ON profiles;
CREATE TRIGGER trg_prevent_last_super_admin_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_super_admin_delete();

-- ============ PROFILES: update/delete policies ============
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

DROP POLICY IF EXISTS "superadmin_delete_profile" ON profiles;
CREATE POLICY "superadmin_delete_profile" ON profiles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));
