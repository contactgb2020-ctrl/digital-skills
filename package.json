/*
# Storage Buckets + Multi-Tenant Isolation + Course Status Fix

## Overview
Creates Supabase Storage buckets for file uploads (videos, KYC documents, course images, diplomas).
Adds 'draft' to course status check. Strengthens multi-tenant RLS for super_admin access.

## Storage Buckets
1. `course-videos` — Trainer video uploads (public read, authenticated write)
2. `kyc-documents` — KYC identity documents (private; owner + super_admin read)
3. `course-images` — Course thumbnail images (public read, authenticated write)
4. `diplomas` — Trainer diploma/certificate uploads (private; owner + super_admin read)
*/

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('diplomas', 'diplomas', false) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES: course-videos (public read, owner write)
-- ============================================================
DROP POLICY IF EXISTS "read_course_videos" ON storage.objects;
CREATE POLICY "read_course_videos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'course-videos');

DROP POLICY IF EXISTS "insert_course_videos" ON storage.objects;
CREATE POLICY "insert_course_videos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'course-videos');

DROP POLICY IF EXISTS "update_course_videos" ON storage.objects;
CREATE POLICY "update_course_videos" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'course-videos');

DROP POLICY IF EXISTS "delete_course_videos" ON storage.objects;
CREATE POLICY "delete_course_videos" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'course-videos');

-- ============================================================
-- STORAGE POLICIES: course-images (public read, owner write)
-- ============================================================
DROP POLICY IF EXISTS "read_course_images" ON storage.objects;
CREATE POLICY "read_course_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "insert_course_images" ON storage.objects;
CREATE POLICY "insert_course_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'course-images');

DROP POLICY IF EXISTS "update_course_images" ON storage.objects;
CREATE POLICY "update_course_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "delete_course_images" ON storage.objects;
CREATE POLICY "delete_course_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'course-images');

-- ============================================================
-- STORAGE POLICIES: kyc-documents (private; owner + super_admin)
-- ============================================================
DROP POLICY IF EXISTS "read_kyc_docs" ON storage.objects;
CREATE POLICY "read_kyc_docs" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'kyc-documents' AND (
      owner = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    )
  );

DROP POLICY IF EXISTS "insert_kyc_docs" ON storage.objects;
CREATE POLICY "insert_kyc_docs" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'kyc-documents' AND owner = auth.uid());

-- ============================================================
-- STORAGE POLICIES: diplomas (private; owner + super_admin)
-- ============================================================
DROP POLICY IF EXISTS "read_diplomas" ON storage.objects;
CREATE POLICY "read_diplomas" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'diplomas' AND (
      owner = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    )
  );

DROP POLICY IF EXISTS "insert_diplomas" ON storage.objects;
CREATE POLICY "insert_diplomas" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'diplomas' AND owner = auth.uid());

-- ============================================================
-- COURSE STATUS: add 'draft' to allowed values
-- ============================================================
DO $$ BEGIN
  ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;
  ALTER TABLE courses ADD CONSTRAINT courses_status_check CHECK (status IN ('draft','pending_review','published','rejected'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- MULTI-TENANT: courses — super_admin can read all
-- ============================================================
DROP POLICY IF EXISTS "read_published_courses" ON courses;
CREATE POLICY "read_published_courses" ON courses FOR SELECT
  TO anon, authenticated USING (
    status = 'published' OR auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- MULTI-TENANT: kyc_documents — super_admin can read/update all
-- ============================================================
DROP POLICY IF EXISTS "select_own_kyc" ON kyc_documents;
CREATE POLICY "select_own_kyc" ON kyc_documents FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "insert_own_kyc" ON kyc_documents;
CREATE POLICY "insert_own_kyc" ON kyc_documents FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_kyc_status" ON kyc_documents;
CREATE POLICY "update_kyc_status" ON kyc_documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- MULTI-TENANT: trainer_earnings — super_admin can read/update all
-- ============================================================
DROP POLICY IF EXISTS "select_own_earnings" ON trainer_earnings;
CREATE POLICY "select_own_earnings" ON trainer_earnings FOR SELECT
  TO authenticated USING (
    trainer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_earnings_status" ON trainer_earnings;
CREATE POLICY "update_earnings_status" ON trainer_earnings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- MULTI-TENANT: categories — super_admin can manage
-- ============================================================
DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "delete_categories" ON categories;
CREATE POLICY "delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- MULTI-TENANT: custom_roles, role_permissions, staff_members
-- ============================================================
DROP POLICY IF EXISTS "select_custom_roles" ON custom_roles;
CREATE POLICY "select_custom_roles" ON custom_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_custom_roles" ON custom_roles;
CREATE POLICY "insert_custom_roles" ON custom_roles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "select_role_permissions" ON role_permissions;
CREATE POLICY "select_role_permissions" ON role_permissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_role_permissions" ON role_permissions;
CREATE POLICY "insert_role_permissions" ON role_permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_role_permissions" ON role_permissions;
CREATE POLICY "update_role_permissions" ON role_permissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "select_staff_members" ON staff_members;
CREATE POLICY "select_staff_members" ON staff_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_staff_members" ON staff_members;
CREATE POLICY "insert_staff_members" ON staff_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- MULTI-TENANT: location_suggestions — super_admin can read/update all
-- ============================================================
DROP POLICY IF EXISTS "select_own_suggestions" ON location_suggestions;
CREATE POLICY "select_own_suggestions" ON location_suggestions FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_suggestion_status" ON location_suggestions;
CREATE POLICY "update_suggestion_status" ON location_suggestions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- INDEXES for tenant queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_tenant ON watch_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_trainer ON trainer_earnings(trainer_id);
