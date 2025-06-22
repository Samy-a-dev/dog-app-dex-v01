-- Phase 2: Swiping Mechanism
-- Item 2.2: Backend: RPC get_profiles_for_swiping(limit INT)

CREATE OR REPLACE FUNCTION get_profiles_for_swiping(fetch_limit INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT, -- Added username to display on match, though not strictly for swiping card
  matcher_dog_image_url TEXT,
  matcher_bio TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    prof.username, -- From the existing 'profiles' table schema in project-outline.md
    p.matcher_dog_image_url,
    p.matcher_bio
  FROM
    public.user_profiles p -- Assuming user_profiles is the correct table name from Phase 1
    JOIN public.profiles prof ON p.user_id = prof.id -- Join to get username
  WHERE
    p.user_id <> current_user_id
    AND p.matcher_dog_image_url IS NOT NULL
    AND p.matcher_bio IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.swipes s
      WHERE
        s.swiper_user_id = current_user_id
        AND s.swiped_user_id = p.user_id
    )
  ORDER BY random() -- Order randomly
  LIMIT fetch_limit;
END;
$$;

-- Test the function (run this in Supabase SQL editor after creating users & profiles):
-- Assuming you are authenticated as a user:
-- SELECT * FROM get_profiles_for_swiping(5);

-- Make sure the user_profiles table alias 'p' and its columns match what you created in Phase 1.
-- The original project-outline.md had a 'profiles' table with 'id' (uuid, PK to auth.users.id) and 'username'.
-- The XP_FEATURE_PLAN.md introduced 'user_profiles' with 'user_id' (uuid, PK to auth.users.id).
-- This RPC assumes 'user_profiles' holds 'matcher_dog_image_url', 'matcher_bio' and 'user_id' (as its PK).
-- And 'profiles' holds 'username' and 'id' (as its PK).
-- If your 'user_profiles' table from Phase 1 also contains 'username', you can simplify the JOIN.
-- For this implementation, I'm assuming 'user_profiles' is the table we added matcher columns to,
-- and 'profiles' is the original table with username. Adjust if your schema is different.
-- If 'user_profiles' is the single source of truth for username, matcher_bio, matcher_dog_image_url,
-- and its primary key is 'user_id' referencing 'auth.users.id', the query simplifies to:
/*
CREATE OR REPLACE FUNCTION get_profiles_for_swiping(fetch_limit INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  matcher_dog_image_url TEXT,
  matcher_bio TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    up.username, -- Assuming username is in user_profiles
    up.matcher_dog_image_url,
    up.matcher_bio
  FROM
    public.user_profiles up
  WHERE
    up.user_id <> current_user_id
    AND up.matcher_dog_image_url IS NOT NULL
    AND up.matcher_bio IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.swipes s
      WHERE
        s.swiper_user_id = current_user_id
        AND s.swiped_user_id = up.user_id
    )
  ORDER BY random()
  LIMIT fetch_limit;
END;
$$;
*/
-- Please review the table structure notes above and use the version of the function
-- that matches your combined schema from project-outline.md, XP_FEATURE_PLAN.md, and Phase 1.
-- The first version of the function assumes 'user_profiles' for matcher data and 'profiles' for username.