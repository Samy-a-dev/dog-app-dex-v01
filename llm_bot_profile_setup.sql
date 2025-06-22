-- This script sets up a profile for an EXISTING user in auth.users
-- to act as our "Demo Pal" for the matching demo.
DO $$
DECLARE
  demo_pal_user_id UUID := '28242d75-99c8-4c5e-a844-dfb46c04546a'; -- UID you confirmed exists
  demo_pal_username TEXT := 'Demo Pal';
  demo_pal_dog_image_url TEXT := 'https://placehold.co/600x400/green/white?text=Demo+Pal'; -- Distinct placeholder
  demo_pal_matcher_bio TEXT := 'I am Demo Pal! Swipe right to see our demo match and chat.';
BEGIN
  -- Insert or Update Demo Pal's profile in user_profiles
  INSERT INTO public.user_profiles (user_id, username, matcher_dog_image_url, matcher_bio, total_xp)
  VALUES (demo_pal_user_id, demo_pal_username, demo_pal_dog_image_url, demo_pal_matcher_bio, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    matcher_dog_image_url = EXCLUDED.matcher_dog_image_url,
    matcher_bio = EXCLUDED.matcher_bio,
    total_xp = EXCLUDED.total_xp; -- Ensure total_xp is also updated or set as desired
    -- No updated_at here, as we confirmed it's not in your user_profiles table

  RAISE NOTICE 'Demo Pal profile for user_id % created/updated in user_profiles.', demo_pal_user_id;
END $$;