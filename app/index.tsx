import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    if (!loading && !showSplash) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }
  }, [user, loading, showSplash]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#FF6B6B' }} />;
  }

  return <View style={{ flex: 1, backgroundColor: '#FF6B6B' }} />;
}
