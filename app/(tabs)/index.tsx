import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FloatingActionButton } from './_layout';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={24} color="#7B4B94" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="person-circle" size={28} color="#7B4B94" />
        </TouchableOpacity>
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Dog Breed Detector</ThemedText>
          <ThemedText style={styles.subtitle}>Your AI-Powered Dog Expert</ThemedText>
          
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/dog-image.png')}
              style={styles.dogImage}
              contentFit="contain"
            />
          </View>
        </ThemedView>
      </ScrollView>
      
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dogImage: {
    width: 280,
    height: 280,
    borderRadius: 12,
  },
});
