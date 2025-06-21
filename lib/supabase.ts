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
    persistSession: true, // Persist session on all platforms
    detectSessionInUrl: typeof window !== 'undefined', // Only detect session in browser
  },
});

export async function saveCapturedDog(
  userId: string,
  imageUri: string,
  breed: string,
  likeness: number,
  locationData: any, // Use a more specific type if available
  timestamp: number,
  rarity: string
) {
  try {
    const { data, error } = await supabase
      .from('captured_dogs') // Assuming your table is named 'captured_dogs'
      .insert([
        {
          user_id: userId,
          image_url: imageUri,
          breed: breed,
          likeness: likeness,
          latitude: locationData?.latitude,
          longitude: locationData?.longitude,
          timestamp: new Date(timestamp).toISOString(), // Convert timestamp to ISO string
          rarity: rarity,
        },
      ])
      .select(); // Select the inserted data

    if (error) {
      console.error('Error saving captured dog:', error);
      return null;
    }

    console.log('Captured dog data saved successfully:', data);
    return data ? data[0] : null; // Return the first inserted row
  } catch (error) {
    console.error('Exception saving captured dog:', error);
    return null;
  }
}
