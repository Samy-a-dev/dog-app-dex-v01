import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// For development, you can use these placeholder values
// Replace with your actual Supabase project credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rmntmoxestcxgikdsrpp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnRtb3hlc3RjeGdpa2RzcnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MzY3OTUsImV4cCI6MjA2NjAxMjc5NX0.DClwZ_0DZQmRgvVdAuvTMoCcj_8z3i8Uy2q0BuuGWeU';

// Create a safe storage adapter that works in all environments
const createSupabaseStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        // Return null for server-side rendering
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        // Only set item if we're in a browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        // Only remove item if we're in a browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  }
  
  // For React Native, lazily import AsyncStorage
  let AsyncStorage: any;
  return {
    getItem: async (key: string) => {
      if (!AsyncStorage) {
        AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      }
      return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (!AsyncStorage) {
        AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      }
      return AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      if (!AsyncStorage) {
        AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      }
      return AsyncStorage.removeItem(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createSupabaseStorage(),
    autoRefreshToken: true,
    persistSession: typeof window !== 'undefined', // Only persist session in browser
    detectSessionInUrl: typeof window !== 'undefined', // Only detect session in browser
  },
});
