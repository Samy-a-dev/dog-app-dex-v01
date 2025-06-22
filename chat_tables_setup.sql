-- Table to store chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(), -- To help sort chat rooms by recent activity

    CONSTRAINT unique_chat_room_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT check_user_order_chat_room CHECK (user1_id < user2_id) -- Ensures user1_id is always the smaller UUID
);

-- RLS Policies for chat_rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Users can see chat rooms they are part of
DROP POLICY IF EXISTS "Allow users to select their own chat rooms" ON public.chat_rooms;
CREATE POLICY "Allow users to select their own chat rooms"
ON public.chat_rooms
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users cannot insert chat rooms directly (will be handled by RPC)
-- DROP POLICY IF EXISTS "Allow users to insert chat rooms they are part of" ON public.chat_rooms;
-- CREATE POLICY "Allow users to insert chat rooms they are part of"
-- ON public.chat_rooms
-- FOR INSERT
-- WITH CHECK (
--    (auth.uid() = user1_id AND auth.uid() <> user2_id) OR
--    (auth.uid() = user2_id AND auth.uid() <> user1_id)
-- );
-- For now, let's assume an RPC with SECURITY DEFINER will handle inserts.

-- Users can update the last_message_at if they are part of the room (e.g., via trigger or RPC)
DROP POLICY IF EXISTS "Allow users to update last_message_at in their chat rooms" ON public.chat_rooms;
CREATE POLICY "Allow users to update last_message_at in their chat rooms"
ON public.chat_rooms
FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- No direct deletes by users for now, could be an admin/cleanup task or handled by RPC
-- DROP POLICY IF EXISTS "Allow users to delete their chat rooms" ON public.chat_rooms;
-- CREATE POLICY "Allow users to delete their chat rooms"
-- ON public.chat_rooms
-- FOR DELETE
-- USING (auth.uid() = user1_id OR auth.uid() = user2_id);

COMMENT ON TABLE public.chat_rooms IS 'Stores chat rooms between two users.';
COMMENT ON COLUMN public.chat_rooms.user1_id IS 'One of the users in the chat room. Smaller UUID of the pair.';
COMMENT ON COLUMN public.chat_rooms.user2_id IS 'The other user in the chat room. Larger UUID of the pair.';
COMMENT ON COLUMN public.chat_rooms.last_message_at IS 'Timestamp of the last message sent in this room, for sorting.';


-- Table to store chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000), -- Basic validation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_chat_room_id ON public.chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC); -- For fetching recent messages

-- RLS Policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages in chat rooms they are part of
DROP POLICY IF EXISTS "Allow users to select messages in their chat rooms" ON public.chat_messages;
CREATE POLICY "Allow users to select messages in their chat rooms"
ON public.chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.chat_rooms cr
        WHERE cr.id = chat_room_id AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    )
);

-- Users can insert messages into chat rooms they are part of, and they must be the sender
DROP POLICY IF EXISTS "Allow users to insert messages as themselves in their chat rooms" ON public.chat_messages;
CREATE POLICY "Allow users to insert messages as themselves in their chat rooms"
ON public.chat_messages
FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1
        FROM public.chat_rooms cr
        WHERE cr.id = chat_room_id AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    )
);

-- Users can update the is_read status of messages sent to them
DROP POLICY IF EXISTS "Allow users to mark messages as read in their chat rooms" ON public.chat_messages;
CREATE POLICY "Allow users to mark messages as read in their chat rooms"
ON public.chat_messages
FOR UPDATE -- Corrected: Removed (is_read) column specification
USING (
    EXISTS (
        SELECT 1
        FROM public.chat_rooms cr
        WHERE cr.id = chat_room_id AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    )
    -- AND sender_id <> auth.uid() -- Optional: ensure they are not marking their own messages as read
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.chat_rooms cr
        WHERE cr.id = chat_room_id AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    )
);


-- No direct deletes of messages by users for now
-- CREATE POLICY "Allow users to delete their own messages"
-- ON public.chat_messages
-- FOR DELETE
-- USING (sender_id = auth.uid());


COMMENT ON TABLE public.chat_messages IS 'Stores individual messages within a chat room.';
COMMENT ON COLUMN public.chat_messages.chat_room_id IS 'The chat room this message belongs to.';
COMMENT ON COLUMN public.chat_messages.sender_id IS 'The user who sent this message.';
COMMENT ON COLUMN public.chat_messages.content IS 'The text content of the message.';
COMMENT ON COLUMN public.chat_messages.is_read IS 'Indicates if the message has been read by the recipient(s).';