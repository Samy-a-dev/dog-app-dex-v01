import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform, Text } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingCarousel from '@/components/OnboardingCarousel';

export default function OnboardingScreen() {
  useEffect(() => {
    // Set status bar style for onboarding
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content', true);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        translucent 
        backgroundColor="transparent" 
        hidden={false}
      />
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.debugText}>Onboarding Screen Loaded</Text>
        <OnboardingCarousel />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  debugText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
});
