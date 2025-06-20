import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
        }}
      />
    </Tabs>
  );
}

// Floating action button component to be used in the home screen
export function FloatingActionButton() {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/breed-detector')}
    >
      <Ionicons name="add" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    marginLeft: -35, // Half of the width to center it
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7B4B94',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
