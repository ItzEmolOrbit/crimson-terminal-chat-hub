
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          // Update user presence
          await updateUserPresence(true);
        } else if (event === 'SIGNED_OUT') {
          await updateUserPresence(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateUserPresence = async (isOnline: boolean) => {
    if (!user) return;

    await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: "SIGN IN SUCCESSFUL",
        description: ">>> Welcome back to Crimson Console",
      });
    } catch (error: any) {
      toast({
        title: "SIGN IN FAILED",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              username,
              created_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              is_online: true
            }
          ]);

        if (profileError) throw profileError;
      }

      toast({
        title: "REGISTRATION SUCCESSFUL",
        description: ">>> Account created. Check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "REGISTRATION FAILED",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await updateUserPresence(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "SIGNED OUT",
        description: ">>> Session terminated securely",
      });
    } catch (error: any) {
      toast({
        title: "SIGN OUT ERROR",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (username: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "PROFILE UPDATED",
        description: ">>> Username updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "UPDATE FAILED",
        description: `>>> ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
