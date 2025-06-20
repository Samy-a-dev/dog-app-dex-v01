import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const UploadButton = ({ children }) => {
    return (
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => router.push('/breed-detector')}
      >
        <Ionicons name="add" size={36} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: '#121212',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => (
        <View style={styles.tabBar}>
          <View style={styles.centerButtonContainer}>
            <UploadButton />
          </View>
        </View>
      )}
    >
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#121212',
    paddingBottom: 15,
    paddingTop: 5,
  },
  centerButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    width: 80,
    height: 80,
    backgroundColor: '#7B4B94',
    borderRadius: 40,
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
