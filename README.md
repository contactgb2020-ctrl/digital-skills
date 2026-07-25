/*
# Add chosen_category_ids to profiles

1. Modified Tables
- `profiles`: add `chosen_category_ids` column (uuid[], default empty array)
  This stores the category IDs a student has chosen during signup or via their profile.
  Used to filter which courses appear in their dashboard.

2. Security
- No new tables. RLS already enabled on profiles.
- No policy changes needed — existing policies already cover read/update of own profile.
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS chosen_category_ids uuid[] DEFAULT '{}';
