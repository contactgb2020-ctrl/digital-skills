/*
# Add reviews, enrollments, quiz_attempts tables

## Overview
Adds three new tables to support course reviews/ratings, student enrollments,
and quiz attempt tracking — making the platform feature-complete vs Udemy.

## New Tables
1. **enrollments** — Tracks which student is enrolled in which course.
   - id, user_id (FK auth.users), course_id (FK courses), progress_pct (int default 0),
     enrolled_at, completed_at.
2. **reviews** — Student reviews and ratings for courses (1-5 stars).
   - id, user_id (FK auth.users), course_id (FK courses), rating (int 1-5),
     comment (text), created_at. Unique per user+course.
3. **quiz_attempts** — Tracks student quiz attempts.
   - id, user_id (FK auth.users), quiz_id (FK quizzes), score (int),
     passed (bool), created_at.

## Security
- RLS enabled on all three tables.
- Enrollments: owner-only CRUD.
- Reviews: anyone authenticated can read; owner can insert/update/delete own.
- Quiz attempts: owner-only.

## Important Notes
1. Owner columns default to auth.uid().
2. Unique constraints prevent duplicate enrollments and duplicate reviews.
*/

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_pct int NOT NULL DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Enrollments: owner-only
DROP POLICY IF EXISTS "select_own_enrollments" ON enrollments;
CREATE POLICY "select_own_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_enrollments" ON enrollments;
CREATE POLICY "insert_own_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_enrollments" ON enrollments;
CREATE POLICY "update_own_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_enrollments" ON enrollments;
CREATE POLICY "delete_own_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Reviews: public read, owner CRUD
DROP POLICY IF EXISTS "read_all_reviews" ON reviews;
CREATE POLICY "read_all_reviews" ON reviews FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_review" ON reviews;
CREATE POLICY "delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Quiz attempts: owner-only
DROP POLICY IF EXISTS "select_own_attempts" ON quiz_attempts;
CREATE POLICY "select_own_attempts" ON quiz_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_attempts" ON quiz_attempts;
CREATE POLICY "insert_own_attempts" ON quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
