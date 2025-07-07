
import { createClient } from '@supabase/supabase-js';
import config from '../../config.json';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anon_key;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your config.json file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  last_seen: string;
  is_online: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio';
  media_url?: string;
  encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPresence {
  user_id: string;
  room_id: string;
  is_typing: boolean;
  last_activity: string;
  status: 'online' | 'away' | 'offline';
}
