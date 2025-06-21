import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getHasSeenOnboarding } from '@/utils/onboarding';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
    if (!loading && hasSeenOnboarding !== null) {
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
  }, [user, loading, hasSeenOnboarding]);

  // Optionally, render nothing or a loading indicator while redirecting
  return <View />;
}
