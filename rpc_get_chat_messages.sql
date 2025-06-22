CREATE OR REPLACE FUNCTION public.get_chat_messages(
    p_chat_room_id UUID
)
RETURNS TABLE (
    id UUID,
    chat_room_id UUID,
    sender_id UUID,
    sender_username TEXT, -- Join to get username
    content TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER -- Can be invoker if RLS on chat_messages and user_profiles is sufficient
AS $$
BEGIN
    -- First, check if the calling user is part of the requested chat room.
    -- This is an important security check, even if RLS also applies.
    IF NOT EXISTS (
        SELECT 1
        FROM public.chat_rooms cr
        WHERE cr.id = p_chat_room_id
          AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'User % is not authorized to access chat room %.', auth.uid(), p_chat_room_id;
    END IF;

    RETURN QUERY
    SELECT
        cm.id,
        cm.chat_room_id,
        cm.sender_id,
        up.username AS sender_username, -- Get the sender's username
        cm.content,
        cm.created_at,
        cm.is_read
    FROM
        public.chat_messages cm
    JOIN
        public.user_profiles up ON cm.sender_id = up.user_id -- Join to get username
    WHERE
        cm.chat_room_id = p_chat_room_id
    ORDER BY
        cm.created_at ASC; -- Show oldest messages first, FlatList can be inverted

EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in get_chat_messages RPC: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        RAISE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_chat_messages(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_chat_messages(UUID) IS 
'Retrieves all messages for a given chat_room_id, including sender username, if the calling user is part of the room. Orders messages by creation time (ascending).';