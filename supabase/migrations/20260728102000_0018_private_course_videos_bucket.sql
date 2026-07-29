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
