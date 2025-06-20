import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import OnboardingCarousel from '@/components/OnboardingCarousel';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
