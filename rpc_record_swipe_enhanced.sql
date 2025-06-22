CREATE OR REPLACE FUNCTION public.record_swipe(
    p_target_user_id UUID,
    p_swipe_direction TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    swipe_type_normalized TEXT;
    match_exists BOOLEAN := false;
    v_matched_username TEXT;
    v_matched_dog_image_url TEXT;
    user_1 UUID;
    user_2 UUID;
BEGIN
    RAISE NOTICE 'record_swipe: Called by user %, target user %, direction %', auth.uid(), p_target_user_id, p_swipe_direction;

    -- Normalize swipe direction
    IF lower(p_swipe_direction) = 'right' OR lower(p_swipe_direction) = 'like' THEN
        swipe_type_normalized := 'like';
    ELSIF lower(p_swipe_direction) = 'left' OR lower(p_swipe_direction) = 'nope' THEN
        swipe_type_normalized := 'nope';
    ELSE
        RAISE EXCEPTION 'Invalid swipe direction: %. Must be ''left'', ''right'', ''like'', or ''nope''.', p_swipe_direction;
    END IF;
    RAISE NOTICE 'record_swipe: Normalized direction to %', swipe_type_normalized;

    -- Record the swipe
    -- Use ON CONFLICT to handle cases where a user re-swipes on the same profile
    INSERT INTO public.swipes (swiper_user_id, swiped_user_id, swipe_type)
    VALUES (current_user_id, p_target_user_id, swipe_type_normalized)
    ON CONFLICT (swiper_user_id, swiped_user_id) DO UPDATE SET
        swipe_type = excluded.swipe_type,
        created_at = NOW(); -- Update timestamp on re-swipe
    RAISE NOTICE 'record_swipe: Swipe recorded for user % on target % as %', current_user_id, p_target_user_id, swipe_type_normalized;

    -- If it's a 'like', check for a mutual like and create a match
    IF swipe_type_normalized = 'like' THEN
        -- DEMO HAPPY PATH: Force match if swiping right on Demo Pal
        IF p_target_user_id = '28242d75-99c8-4c5e-a844-dfb46c04546a'::UUID THEN
            RAISE NOTICE 'record_swipe: DEMO MODE - User % swiped like on Demo Pal (%). Forcing match.', current_user_id, p_target_user_id;
            match_exists := true;
        ELSE
            -- Standard mutual like check for other users
            RAISE NOTICE 'record_swipe: Swipe was a like. Checking for mutual like from % to %.', p_target_user_id, current_user_id;
            SELECT EXISTS (
                SELECT 1
                FROM public.swipes
                WHERE swiper_user_id = p_target_user_id
                  AND swiped_user_id = current_user_id
                  AND swipe_type = 'like'
            ) INTO match_exists;
            RAISE NOTICE 'record_swipe: Mutual like check result (match_exists): %', match_exists;
        END IF;

        IF match_exists THEN
            RAISE NOTICE 'record_swipe: Mutual like confirmed or forced! Creating match between % and %.', current_user_id, p_target_user_id;
            -- Ensure consistent order for user1_id and user2_id to satisfy the CHECK constraint
            -- and simplify querying / prevent duplicate pairs in different orders.
            IF current_user_id < p_target_user_id THEN
                user_1 := current_user_id;
                user_2 := p_target_user_id;
            ELSE
                user_1 := p_target_user_id;
                user_2 := current_user_id;
            END IF;

            -- Insert into matches table
            -- ON CONFLICT DO NOTHING handles the case where the match already exists (e.g., due to a race condition or re-processing)
            INSERT INTO public.matches (user1_id, user2_id, created_at)
            VALUES (user_1, user_2, NOW())
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
            RAISE NOTICE 'record_swipe: Match inserted/confirmed for user_1: %, user_2: %', user_1, user_2;

            -- Get matched user's details for the return JSON
            -- This assumes the target user has a profile in user_profiles
            SELECT up.username, up.matcher_dog_image_url
            INTO v_matched_username, v_matched_dog_image_url
            FROM public.user_profiles up
            WHERE up.user_id = p_target_user_id;

            RETURN json_build_object(
                'status', 'match_created',
                'message', 'It''s a match!',
                'swiper_user_id', current_user_id,       -- The user who performed this swipe
                'target_user_id', p_target_user_id,       -- The user who was swiped on in this action
                'matched_user_id', p_target_user_id,      -- Redundant with target_user_id in this context, but clear
                'matched_username', v_matched_username,
                'matched_dog_image_url', v_matched_dog_image_url
            );
        ELSE
            RAISE NOTICE 'record_swipe: No mutual like found yet. Returning swipe_recorded.';
        END IF;
    ELSE
         RAISE NOTICE 'record_swipe: Swipe was not a like (it was %). Returning swipe_recorded.', swipe_type_normalized;
    END IF;

    -- If no match was created (either not a 'like' swipe, or no mutual like yet)
    RETURN json_build_object(
        'status', 'swipe_recorded',
        'message', 'Swipe recorded successfully.',
        'swiper_user_id', current_user_id,
        'target_user_id', p_target_user_id,
        'swipe_type', swipe_type_normalized
    );

EXCEPTION
    WHEN others THEN
        -- Log the error to the PostgreSQL logs for debugging
        RAISE WARNING 'Error in record_swipe RPC: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        -- Return a generic error message to the client
        RETURN json_build_object('status', 'error', 'message', 'An unexpected error occurred while recording the swipe.');
END;
$$;