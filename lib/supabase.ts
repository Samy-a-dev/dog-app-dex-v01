import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system'; // Import FileSystem

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
    // Determine file extension and create a unique file name
    let fileExtension: string;
    let fileName: string;
    let fileBody: Blob | string;
    let mimeType: string = 'image/jpeg'; // Default MIME type

    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
        // Handle data URI on web
        const mimeMatch = imageUri.match(/^data:(.*?);base64,/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        fileExtension = mimeType.split('/')[1] || 'jpg'; // Extract extension from mimeType

        const byteCharacters = atob(imageUri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileBody = new Blob([byteArray], { type: mimeType });

    } else if (imageUri.startsWith('file://')) {
        // Handle file URI on native
        fileExtension = imageUri.split('.').pop() || 'jpg';
        // Fetch the blob directly from the URI
        const response = await fetch(imageUri);
        fileBody = await response.blob();
        // Try to get mimeType from blob, or infer from extension
        mimeType = fileBody.type || `image/${fileExtension}`;

    } else {
        // Handle other potential URI types or errors
        throw new Error(`Unsupported image URI format: ${imageUri}`);
    }
    
    fileName = `${userId}/${Date.now()}.${fileExtension}`; // Unique path in storage
    console.log(`Supabase upload details: FileName: [${fileName}], MimeType: [${mimeType}], FileBody type: [${typeof fileBody}]`);

    // Upload the image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dog-images') // Use your bucket name
        .upload(fileName, fileBody, {
            cacheControl: '3600',
            upsert: false, // Set to true if you want to overwrite existing files with the same name
            contentType: mimeType, // Explicitly set content type
        });

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError; // Propagate error
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
        .from('dog-images')
        .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Error getting public URL for image:', fileName);
        throw new Error('Could not get public URL after upload.');
    }

    const publicImageUrl = publicUrlData.publicUrl;

    // Insert the record with the public URL
    const { data, error } = await supabase
      .from('captured_dogs') // Assuming your table is named 'captured_dogs'
      .insert([
        {
          user_id: userId,
          image_url: publicImageUrl, // Use the public URL here
          breed_name: breed, // Use breed_name as per schema
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
