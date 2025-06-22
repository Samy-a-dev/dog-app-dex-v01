-- Phase 1: Matcher Profile Setup
-- Item 1.1: Database: Extend user_profiles Table

-- Add new columns for the matcher feature to the user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN matcher_dog_image_url TEXT NULL,
ADD COLUMN matcher_bio TEXT NULL;

-- Ensure Row Level Security is enabled on user_profiles table.
-- If it's not already enabled, uncomment the following line:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to view their own profile.
-- This policy should ideally already exist from your XP_FEATURE_PLAN.md setup.
-- If not, you might need a policy like this (verify it doesn't conflict with existing ones):
-- CREATE POLICY "Allow users to view their own profile"
-- ON public.user_profiles FOR SELECT
-- USING (auth.uid() = user_id);

-- RLS Policy: Allow users to update their own matcher_dog_image_url and matcher_bio.
-- This policy ensures users can only update their own profile row for these specific fields.
CREATE POLICY "Allow users to update their own matcher profile data"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Important Security Note on UPDATE Policies:
-- Please review your existing RLS policies for the 'user_profiles' table, especially for UPDATE operations.
-- The 'XP_FEATURE_PLAN.md' mentioned a policy:
--   CREATE POLICY "Allow backend to update profiles"
--   ON public.user_profiles FOR UPDATE
--   USING (true); -- This was for service_role or security definer functions.
-- If a broad 'USING (true)' policy for UPDATE exists and applies to the 'authenticated' role,
-- it could grant unrestricted update access to any user_profiles row by any authenticated user.
-- This would override the specific policy created above for matcher profile data.
-- Ensure that broad update policies are restricted to appropriate roles (e.g., 'service_role')
-- or are carefully designed if they must apply to 'authenticated' users.
-- The policy "Allow users to update their own matcher profile data" is intended for user-driven updates of their own profile.