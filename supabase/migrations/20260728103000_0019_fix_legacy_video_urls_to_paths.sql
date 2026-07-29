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
