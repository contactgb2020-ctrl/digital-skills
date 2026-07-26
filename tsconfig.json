/*
# Digital Skills Africa — Initial Schema

## Overview
Creates the complete database schema for the Digital Skills Africa SaaS platform:
a training platform for digital and beauty skills aimed at African youth and women.

## New Tables
1. countries — Reference list of countries (Africa-first, extensible worldwide).
2. regions — Provinces/states belonging to a country.
3. cities — Cities belonging to a region.
4. districts — Neighborhoods/districts belonging to a city.
5. location_suggestions — User-submitted locations pending admin validation.
6. profiles — Public user profile data (1:1 with auth.users).
7. subscriptions — SaaS plan subscriptions.
8. payments — Payment records for subscriptions.
9. courses — Training courses.
10. lessons — Lessons within a course.
11. quizzes — Quiz questions tied to a lesson.
12. progress — Student lesson completion tracking.
13. certificates — Course completion certificates.
14. organizations — Multi-tenant organizations (Enterprise plan).
15. organization_members — Members of an organization.

## Security (RLS)
- RLS enabled on ALL tables.
- Profiles: owner read/update; all authenticated can read (limited fields).
- Location data: public read (anon + authenticated).
- Subscriptions/payments: owner-only.
- Courses: public read for published; trainers CRUD their own.
- Lessons/quizzes: public read; trainers CRUD their own course's children.
- Progress/certificates: owner-only.
- Organizations: members read; owner manage.

## Important Notes
1. profiles.id references auth.users.id directly (1:1).
2. Owner columns default to auth.uid() so inserts omitting them pass RLS.
3. All policies use auth.uid(), never current_user.
4. Auto-create profile on signup via trigger.
*/

-- ============================================================
-- LOCATION REFERENCE TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS location_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('country','region','city','district')),
  parent_id uuid,
  proposed_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nom text NOT NULL DEFAULT '',
  avatar text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','trainer','super_admin')),
  revenue_share int NOT NULL DEFAULT 0,
  country_id uuid REFERENCES countries(id),
  region_id uuid REFERENCES regions(id),
  city_id uuid REFERENCES cities(id),
  district_id uuid REFERENCES districts(id),
  language text NOT NULL DEFAULT 'fr',
  theme text NOT NULL DEFAULT 'light',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('starter','premium','enterprise')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- COURSES, LESSONS, QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image text DEFAULT '',
  category text NOT NULL,
  level text NOT NULL DEFAULT 'Débutant' CHECK (level IN ('Débutant','Intermédiaire','Avancé')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('pending_review','published','rejected')),
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text DEFAULT '',
  document_url text DEFAULT '',
  duration int NOT NULL DEFAULT 0,
  order_number int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]',
  correct_answer int NOT NULL DEFAULT 0,
  explanation text DEFAULT '',
  passing_score int NOT NULL DEFAULT 70,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROGRESS & CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- ============================================================
-- ORGANIZATIONS (MULTI-TENANT)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text DEFAULT '',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_districts_city ON districts(city_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: LOCATION REFERENCE (public read)
-- ============================================================
DROP POLICY IF EXISTS "public_read_countries" ON countries;
CREATE POLICY "public_read_countries" ON countries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_regions" ON regions;
CREATE POLICY "public_read_regions" ON regions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_cities" ON cities;
CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_districts" ON districts;
CREATE POLICY "public_read_districts" ON districts FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- POLICIES: LOCATION SUGGESTIONS
-- ============================================================
DROP POLICY IF EXISTS "insert_own_suggestion" ON location_suggestions;
CREATE POLICY "insert_own_suggestion" ON location_suggestions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "select_own_suggestions" ON location_suggestions;
CREATE POLICY "select_own_suggestions" ON location_suggestions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES: PROFILES
-- ============================================================
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- POLICIES: SUBSCRIPTIONS (owner-only)
-- ============================================================
DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICIES: PAYMENTS (owner-only)
-- ============================================================
DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICIES: COURSES
-- ============================================================
DROP POLICY IF EXISTS "read_published_courses" ON courses;
CREATE POLICY "read_published_courses" ON courses FOR SELECT
  TO anon, authenticated USING (status = 'published' OR auth.uid() = created_by);
DROP POLICY IF EXISTS "insert_own_courses" ON courses;
CREATE POLICY "insert_own_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "update_own_courses" ON courses;
CREATE POLICY "update_own_courses" ON courses FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "delete_own_courses" ON courses;
CREATE POLICY "delete_own_courses" ON courses FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- ============================================================
-- POLICIES: LESSONS
-- ============================================================
DROP POLICY IF EXISTS "read_lessons" ON lessons;
CREATE POLICY "read_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id
      AND (courses.status = 'published' OR courses.created_by = auth.uid()))
  );
DROP POLICY IF EXISTS "insert_own_lessons" ON lessons;
CREATE POLICY "insert_own_lessons" ON lessons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_lessons" ON lessons;
CREATE POLICY "update_own_lessons" ON lessons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_lessons" ON lessons;
CREATE POLICY "delete_own_lessons" ON lessons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.created_by = auth.uid())
  );

-- ============================================================
-- POLICIES: QUIZZES
-- ============================================================
DROP POLICY IF EXISTS "read_quizzes" ON quizzes;
CREATE POLICY "read_quizzes" ON quizzes FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND (c.status = 'published' OR c.created_by = auth.uid()))
  );
DROP POLICY IF EXISTS "insert_own_quizzes" ON quizzes;
CREATE POLICY "insert_own_quizzes" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND c.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_quizzes" ON quizzes;
CREATE POLICY "update_own_quizzes" ON quizzes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND c.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND c.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_quizzes" ON quizzes;
CREATE POLICY "delete_own_quizzes" ON quizzes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND c.created_by = auth.uid())
  );

-- ============================================================
-- POLICIES: PROGRESS (owner-only)
-- ============================================================
DROP POLICY IF EXISTS "select_own_progress" ON progress;
CREATE POLICY "select_own_progress" ON progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_progress" ON progress;
CREATE POLICY "insert_own_progress" ON progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_progress" ON progress;
CREATE POLICY "update_own_progress" ON progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICIES: CERTIFICATES (owner-only)
-- ============================================================
DROP POLICY IF EXISTS "select_own_certificates" ON certificates;
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICIES: ORGANIZATIONS
-- ============================================================
DROP POLICY IF EXISTS "read_own_organizations" ON organizations;
CREATE POLICY "read_own_organizations" ON organizations FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_organizations" ON organizations;
CREATE POLICY "insert_own_organizations" ON organizations FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "update_own_organizations" ON organizations;
CREATE POLICY "update_own_organizations" ON organizations FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- POLICIES: ORGANIZATION MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "read_org_members" ON organization_members;
CREATE POLICY "read_org_members" ON organization_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_members.organization_id AND o.owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_org_members" ON organization_members;
CREATE POLICY "insert_org_members" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_members.organization_id AND o.owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_org_members" ON organization_members;
CREATE POLICY "delete_org_members" ON organization_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_members.organization_id AND o.owner_id = auth.uid())
  );

-- ============================================================
-- FUNCTION: handle_new_user — auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nom', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
