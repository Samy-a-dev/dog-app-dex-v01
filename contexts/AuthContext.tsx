import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { debugOAuth } from '@/utils/debugOAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  totalXp: number | null; // Added
  loadingXp: boolean; // Added
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState<number | null>(null); // Added
  const [loadingXp, setLoadingXp] = useState(true); // Added

  const fetchUserXp = async (userId: string) => {
    console.log(`[XP DEBUG] AuthContext: fetchUserXp called for user ID: ${userId}`);
    setLoadingXp(true);
    try {
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      console.log(`[XP DEBUG] AuthContext: Supabase response for user_profiles. Data: ${JSON.stringify(data)}, Error: ${JSON.stringify(error)}, Status: ${status}`);

      if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows (single row expected but not found)
        console.error('[XP DEBUG] AuthContext: Error fetching user XP from Supabase:', error);
        setTotalXp(0); // Default to 0 on error
      } else if (data) {
        console.log(`[XP DEBUG] AuthContext: Successfully fetched XP: ${data.total_xp}. Setting state.`);
        setTotalXp(data.total_xp);
      } else {
        // This case handles PGRST116 (no rows found) or if data is null for other reasons.
        console.log('[XP DEBUG] AuthContext: No XP profile data found for user (or error PGRST116). Defaulting totalXp to 0.');
        setTotalXp(0); // Default to 0 if no profile exists
      }
    } catch (e) {
      console.error('[XP DEBUG] AuthContext: Exception during fetchUserXp:', e);
      setTotalXp(0); // Default to 0 on exception
    } finally {
      console.log('[XP DEBUG] AuthContext: Finished fetchUserXp try-catch block. Setting loadingXp to false.');
      setLoadingXp(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setLoadingXp(true);
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserXp(currentUser.id);
      } else {
        setTotalXp(null);
        setLoadingXp(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log('[AUTH_CONTEXT_DEBUG] onAuthStateChange triggered. Event:', _event, 'New Session User ID:', newSession?.user?.id ?? 'null');
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserXp(currentUser.id);
        } else {
          setTotalXp(null);
          setLoadingXp(false);
        }
        setLoading(false); // Ensure loading is set to false after auth state change
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    try {
      console.log(`Starting ${provider} sign-in...`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/auth/callback`
            : 'dogappdexv01://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error(`${provider} sign-in error:`, error);
        throw new Error(`${provider} sign-in failed: ${error.message}`);
      }
      
      console.log(`${provider} sign-in initiated successfully`);
      return data;
    } catch (error: any) {
      console.error(`${provider} sign-in exception:`, error);
      
      // Use debug utility for troubleshooting
      await debugOAuth.troubleshootOAuth(provider, error);
      
      // Handle specific Android/OAuth errors
      if (error.message?.includes('Failed to download remote update')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message?.includes('java.io.IOException')) {
        throw new Error('Authentication service temporarily unavailable. Please try again.');
      } else if (error.message?.includes('OAuth')) {
        throw new Error('Authentication failed. Please try again or use email/password login.');
      }
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        totalXp, // Added
        loadingXp, // Added
        signIn,
        signUp,
        signOut,
        signInWithProvider,
      }}
    >
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
