CREATE OR REPLACE FUNCTION public.create_or_get_chat_room(
    p_user_id_1 UUID, -- The ID of the first user (e.g., the current user)
    p_user_id_2 UUID  -- The ID of the second user (e.g., the matched user)
)
RETURNS UUID -- Returns the chat_room_id
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with the permissions of the function owner
AS $$
DECLARE
    v_chat_room_id UUID;
    v_ordered_user1_id UUID;
    v_ordered_user2_id UUID;
BEGIN
    -- Ensure p_user_id_1 and p_user_id_2 are not the same
    IF p_user_id_1 = p_user_id_2 THEN
        RAISE EXCEPTION 'Cannot create a chat room with the same user (%).', p_user_id_1;
    END IF;

    -- Determine the correct order for user1_id and user2_id to match the table constraint
    IF p_user_id_1 < p_user_id_2 THEN
        v_ordered_user1_id := p_user_id_1;
        v_ordered_user2_id := p_user_id_2;
    ELSE
        v_ordered_user1_id := p_user_id_2;
        v_ordered_user2_id := p_user_id_1;
    END IF;

    -- Try to find an existing chat room
    SELECT id INTO v_chat_room_id
    FROM public.chat_rooms
    WHERE user1_id = v_ordered_user1_id AND user2_id = v_ordered_user2_id;

    -- If no chat room exists, create one
    IF v_chat_room_id IS NULL THEN
        INSERT INTO public.chat_rooms (user1_id, user2_id)
        VALUES (v_ordered_user1_id, v_ordered_user2_id)
        RETURNING id INTO v_chat_room_id;
    END IF;

    RETURN v_chat_room_id;

EXCEPTION
    WHEN others THEN
        -- Log the error to the PostgreSQL logs for debugging
        RAISE WARNING 'Error in create_or_get_chat_room RPC: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        -- Re-raise the exception to ensure the transaction is rolled back and the client gets an error
        RAISE; 
END;
$$;

-- Grant execute permission to authenticated users
-- Since it's SECURITY DEFINER, the internal operations are privileged,
-- but we still need to allow authenticated users to call the function.
GRANT EXECUTE ON FUNCTION public.create_or_get_chat_room(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.create_or_get_chat_room(UUID, UUID) IS 
'Creates a new chat room for two users if one does not already exist, or returns the ID of the existing chat room. Ensures user IDs are ordered correctly.';