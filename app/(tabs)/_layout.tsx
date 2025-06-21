import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dogs',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dogedex"
        options={{
          title: 'Dogedex',
          tabBarIcon: ({ color }) => (
            <View className="flex items-center justify-center rounded-full bg-purple-100/10 p-0.5">
              <IconSymbol 
                size={28} 
                name="pawprint.fill" 
                color={color} 
                style={{ transform: [{ rotate: '0deg' }] }} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View className="flex items-center justify-center rounded-full bg-purple-100/10 p-0.5">
              <IconSymbol 
                size={28} 
                name="person.fill" 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => (
            <View className="flex items-center justify-center rounded-full bg-purple-100/10 p-0.5">
              <IconSymbol 
                size={28} 
                name="camera.fill" 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
