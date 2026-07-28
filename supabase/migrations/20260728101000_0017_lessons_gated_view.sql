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
