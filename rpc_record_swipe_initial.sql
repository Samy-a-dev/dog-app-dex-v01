-- Phase 2: Swiping Mechanism
-- Item 2.4: Backend: RPC record_swipe(target_user_id UUID, swipe_direction TEXT) (Initial Version)

CREATE OR REPLACE FUNCTION record_swipe(
  p_target_user_id UUID,
  p_swipe_direction TEXT -- Expected 'left' or 'right' (or 'top', 'bottom' if deck swiper uses them)
)
RETURNS JSON -- Will return match status in Phase 3
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_swipe_type TEXT;
BEGIN
  -- Normalize swipe direction to swipe_type for the table
  IF p_swipe_direction = 'left' OR p_swipe_direction = 'bottom' THEN
    v_swipe_type := 'dislike';
  ELSIF p_swipe_direction = 'right' OR p_swipe_direction = 'top' THEN
    v_swipe_type := 'like';
  ELSE
    RAISE EXCEPTION 'Invalid swipe direction: %', p_swipe_direction;
  END IF;

  -- Insert the swipe into the swipes table
  -- The primary key (swiper_user_id, swiped_user_id) handles cases
  -- where a user might try to swipe on the same profile multiple times.
  -- The ON CONFLICT DO NOTHING ensures that if they somehow manage to trigger
  -- this for an existing pair, it doesn't error out, though ideally the UI
  -- should prevent reswiping on already swiped profiles.
  INSERT INTO public.swipes (swiper_user_id, swiped_user_id, swipe_type)
  VALUES (current_user_id, p_target_user_id, v_swipe_type)
  ON CONFLICT (swiper_user_id, swiped_user_id) DO NOTHING;

  -- In Phase 3, we will add logic here to check for a mutual like
  -- and create a record in the 'matches' table, then return match details.
  -- For now, return a simple confirmation.
  RETURN json_build_object('status', 'swipe_recorded', 'target_user_id', p_target_user_id, 'swipe_type', v_swipe_type);
END;
$$;

-- Example Test (run in Supabase SQL editor, requires a valid target user UUID):
-- Assuming you are authenticated and 'some-other-user-uuid' is a valid UUID of another user:
-- SELECT record_swipe('some-other-user-uuid', 'right');
-- SELECT record_swipe('some-other-user-uuid', 'left');