
import { useState, useEffect, useCallback } from 'react';
import { supabase, Message, UserPresence } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { EncryptionManager } from '@/utils/encryption';

export const useRealtime = (roomId: string = 'general') => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<UserPresence[]>([]);
  const { user } = useAuth();
  const encryptionManager = EncryptionManager.getInstance();

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          if (msg.encrypted && msg.content) {
            try {
              msg.content = await encryptionManager.decryptMessage(msg.content);
            } catch (error) {
              console.error('Failed to decrypt message:', error);
            }
          }
          return msg;
        })
      );

      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [roomId]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string
  ) => {
    if (!user) return;

    try {
      let encryptedContent = content;
      if (content) {
        encryptedContent = await encryptionManager.encryptMessage(content);
      }

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: roomId,
            sender_id: user.id,
            content: encryptedContent,
            message_type: messageType,
            media_url: mediaUrl,
            encrypted: true
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, roomId]);

  // Update typing status
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          is_typing: isTyping,
          last_activity: new Date().toISOString(),
          status: 'online'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user, roomId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Decrypt message if encrypted
          if (newMessage.encrypted && newMessage.content) {
            try {
              newMessage.content = await encryptionManager.decryptMessage(newMessage.content);
            } catch (error) {
              console.error('Failed to decrypt message:', error);
            }
          }

          // Fetch sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          if (senderData) {
            (newMessage as any).sender = senderData;
          }

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel(`presence:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const presence = payload.new as UserPresence;
          
          setOnlineUsers(prev => {
            const filtered = prev.filter(p => p.user_id !== presence.user_id);
            if (presence.status === 'online') {
              return [...filtered, presence];
            }
            return filtered;
          });

          setTypingUsers(prev => {
            const filtered = prev.filter(p => p.user_id !== presence.user_id);
            if (presence.is_typing && presence.user_id !== user?.id) {
              return [...filtered, presence];
            }
            return filtered;
          });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
    };
  }, [roomId, fetchMessages, user?.id]);

  return {
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    updateTypingStatus
  };
};
