-- Phase 2: Swiping Mechanism
-- Item 2.1: Database: Create swipes Table

CREATE TABLE public.swipes (
  swiper_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swipe_type TEXT NOT NULL CHECK (swipe_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (swiper_user_id, swiped_user_id) -- A user can only swipe once on another user
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to insert their own swipes.
CREATE POLICY "Users can insert their own swipes"
ON public.swipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = swiper_user_id);

-- RLS Policy: Allow users to select their own past swipes (e.g., for "already swiped" logic).
-- This is optional for the core feature but good for potential enhancements or debugging.
CREATE POLICY "Users can select their own swipes"
ON public.swipes
FOR SELECT
TO authenticated
USING (auth.uid() = swiper_user_id);

-- Note: No UPDATE or DELETE policies are defined by default for swipes.
-- Typically, swipes are immutable once made. If you need to allow users
-- to change a swipe (e.g., "undo"), you would add specific RLS for that.