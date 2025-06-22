-- Phase 3: Matching Logic
-- Item 3.1: Database: Create matches Table

CREATE TABLE public.matches (
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user1_id, user2_id),
  CONSTRAINT check_user_order CHECK (user1_id < user2_id) -- Ensures uniqueness and prevents duplicate pairs (userA, userB) vs (userB, userA)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to select matches they are part of.
CREATE POLICY "Users can select their own matches"
ON public.matches
FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policy: Allow backend (e.g., record_swipe RPC if SECURITY DEFINER) or specific roles to insert matches.
-- If record_swipe is SECURITY INVOKER, it won't be able to insert into matches directly
-- unless users have INSERT rights, which is generally not recommended for a matches table.
-- For now, let's assume the RPC will be SECURITY DEFINER or a service role will handle inserts.
-- If record_swipe remains SECURITY INVOKER, this policy would need to be TO authenticated
-- and the RPC would need to handle ensuring users can only create matches involving themselves.
-- However, it's safer for the RPC to handle match creation logic.
-- This policy is a placeholder; actual insert rights will depend on how record_swipe is implemented.
/*
CREATE POLICY "Allow backend to insert matches"
ON public.matches
FOR INSERT
TO service_role -- Or a specific role that the RPC runs as if SECURITY DEFINER
WITH CHECK (true);
*/

-- For now, no direct insert policy for authenticated users on 'matches'.
-- Match creation will be handled by the enhanced 'record_swipe' RPC.