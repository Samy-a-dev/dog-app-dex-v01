import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, Text, ActivityIndicator } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback received with params:', params);
        
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth?error=oauth_failed');
          return;
        }

        if (data.session) {
          console.log('OAuth success, session established');
          router.replace('/(tabs)');
        } else {
          console.log('No session found, redirecting to auth');
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Auth callback exception:', error);
        router.replace('/auth?error=oauth_exception');
      }
    };

    handleAuthCallback();
  }, [params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
        Completing authentication...
      </Text>
    </View>
  );
}
