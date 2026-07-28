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
