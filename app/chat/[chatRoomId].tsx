import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Alert } from 'react-native'; // Added Alert

// Updated Message interface to match RPC output and include sender_username
interface Message {
  id: string; // UUID
  chat_room_id: string; // UUID
  sender_id: string; // UUID
  sender_username?: string; // Comes from RPC join
  content: string;
  created_at: string; // TIMESTAMPTZ
  is_read?: boolean;
}

// Interface for the arguments of get_chat_messages RPC
interface GetChatMessagesArgs {
  p_chat_room_id: string;
}


export default function ChatScreen() {
  const { chatRoomId, matchedUserName } = useLocalSearchParams<{ chatRoomId: string; matchedUserName?: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatRoomId) {
      setError("Chat room ID is missing.");
      setLoading(false);
      return;
    }
    if (!user) {
        // Should be handled by a higher-level auth guard, but good to check
        router.replace('/auth');
        return;
    }

    // Configure the header title
    // Note: This might be better done in a _layout.tsx file for the chat stack if you have one
    // For now, we can try setting it directly if this screen is part of a Stack.
    // If not directly in a stack, this might not work as expected.
    // Consider using <Stack.Screen options={{ title: matchedUserName || 'Chat' }} /> in a layout.

    console.log(`Opening chat room: ${chatRoomId} with ${matchedUserName || 'user'}`);
    
    const fetchMessages = async () => {
      if (!chatRoomId || !user) return;
      setLoading(true);
      setError(null);
      try {
        const rpcArgs: GetChatMessagesArgs = { p_chat_room_id: chatRoomId };
        const { data: fetchedMessages, error: rpcError } = await supabase.rpc(
          'get_chat_messages',
          rpcArgs
        );

        if (rpcError) {
          console.error('Error fetching messages:', rpcError);
          setError(`Failed to load messages: ${rpcError.message}`);
          // Check if the error is due to authorization (user not part of the room)
          if (rpcError.message.includes("is not authorized to access chat room")) {
            // Potentially redirect or show a specific message
            Alert.alert("Access Denied", "You are not authorized to view this chat.");
            // router.replace('/'); // Or some other appropriate screen
          }
          return;
        }
        
        // The RPC returns an array of Message objects
        const messagesData = fetchedMessages as Message[] | null;
        if (messagesData) {
          setMessages(messagesData);
        } else {
          setMessages([]); // Set to empty array if null/undefined response
        }

      } catch (e: any) {
        console.error('Exception fetching messages:', e);
        setError(`An unexpected error occurred: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`chat_room:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          console.log('New message received via subscription:', payload.new);
          const newMessagePayload = payload.new as Message;
          
          // To display sender_username for new messages via subscription,
          // we might need to fetch it or the RPC that inserts messages should return it.
          // For now, sender_username might be missing for subscribed messages
          // unless we make another query or adjust the insert process.
          // A simpler approach for now is that `get_chat_messages` provides it on initial load/refresh.
          // For messages coming via subscription, we might not have `sender_username` immediately.
          // Let's assume for now the optimistic update or a subsequent fetch will handle username display.

          setMessages((prevMessages) => {
            // Avoid duplicates if optimistic update already added it (less likely with UUIDs)
            if (prevMessages.find(msg => msg.id === newMessagePayload.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessagePayload];
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to chat_room:${chatRoomId}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Subscription error on chat_room:${chatRoomId}:`, err);
          setError(`Real-time connection error. Please refresh. Status: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };

  }, [chatRoomId, user, router, matchedUserName]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatRoomId) return;

    const messageContent = newMessage.trim();
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      chat_room_id: chatRoomId,
      sender_id: user.id,
      // Attempt to get username from user object if available, otherwise it'll be undefined
      // This depends on what your `useAuth` context's `user` object contains.
      // Let's assume user.user_metadata.username or similar might exist.
      // For now, we'll leave it potentially undefined for the optimistic update.
      sender_username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'You',
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setNewMessage(''); // Clear input immediately
    setMessages(prev => [...prev, optimisticMessage]); // Optimistic update

    try {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content: messageContent,
          // created_at and id will be set by the database
        });

      if (insertError) {
        console.error('Error sending message:', insertError);
        Alert.alert('Send Error', `Could not send message: ${insertError.message}`);
        // Revert optimistic update if needed, or mark message as failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      } else {
        console.log('Message sent successfully to DB');
        // The real-time subscription should ideally pick this up and replace the optimistic one
        // or confirm it. If not, a pull-to-refresh or periodic fetch would be a fallback.
        // For now, the subscription is the primary way to get DB-confirmed messages.

        // --- Simulate Demo Pal's reply ---
        // Check if the current chat is with Demo Pal.
        // We need a way to know the other user's ID in the chat.
        // For now, we'll assume if matchedUserName is "Demo Pal", it's our bot.
        // A more robust way would be to pass Demo Pal's actual ID to the chat screen
        // or fetch chat room participants.
        // For this demo, we'll rely on the matchedUserName.
        
        // A better check: The `matchedUserName` param is passed from `find-walkers.tsx`
        // If we are chatting with "Demo Pal" (or whatever name we gave our dummy user)
        if (matchedUserName === 'Demo Pal') { // Ensure this matches the username used for Demo Pal
          setTimeout(() => {
            const demoPalReply: Message = {
              id: `temp-reply-${Date.now()}`,
              chat_room_id: chatRoomId,
              sender_id: '28242d75-99c8-4c5e-a844-dfb46c04546a', // Demo Pal's actual User UID
              sender_username: 'Demo Pal',
              content: 'Woof! That sounds interesting! Tell me more. (Demo Reply)',
              created_at: new Date().toISOString(),
              is_read: false,
            };
            setMessages(prev => [...prev, demoPalReply]);
          }, 1500); // Add a slight delay for the reply
        }
        // --- End Simulate Demo Pal's reply ---

      }
    } catch (e: any) {
      console.error('Exception sending message:', e);
      Alert.alert('Send Error', 'An unexpected error occurred while sending the message.');
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: matchedUserName || 'Chat' }} />
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender_id === user?.id ? styles.myMessage : styles.theirMessage]}>
            {item.sender_id !== user?.id && ( // Show sender username for their messages
              <Text style={styles.senderName}>{item.sender_username || 'User'}</Text>
            )}
            <Text style={styles.messageContent}>{item.content}</Text>
            <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        inverted // To show latest messages at the bottom
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          onSubmitEditing={handleSendMessage} // Allows sending with keyboard 'send'/'return'
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6', // Light green, typical for sender
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF', // White, typical for receiver
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageContent: {
    fontSize: 16,
  },
  senderName: { // Style for sender's name on their messages
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  sendButton: {
    backgroundColor: '#007AFF', // iOS blue
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});