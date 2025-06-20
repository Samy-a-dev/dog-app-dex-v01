import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import { getHasSeenOnboarding } from '@/utils/onboarding';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = React.useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check if user has seen onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      const seen = await getHasSeenOnboarding();
      setHasSeenOnboarding(seen);
    }
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (!loading && !showSplash && hasSeenOnboarding !== null) {
      if (user) {
        // If user is logged in but hasn't seen onboarding, show it
        if (!hasSeenOnboarding) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/auth');
      }
    }
  }, [user, loading, showSplash, hasSeenOnboarding]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#FF6B6B' }} />;
  }

  return <View style={{ flex: 1, backgroundColor: '#FF6B6B' }} />;
}
