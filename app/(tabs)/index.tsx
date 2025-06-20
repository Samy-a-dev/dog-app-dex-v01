import { StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#7B4B94', dark: '#3A1D4A' }}
      headerImage={
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80' }}
          style={styles.dogImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Dog Breed Detector</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.descriptionContainer}>
        <ThemedText>
          Take a photo of any dog and instantly identify its breed using AI-powered image recognition.
        </ThemedText>
      </ThemedView>
      
      <TouchableOpacity 
        style={styles.cameraButton} 
        onPress={() => router.push('/breed-detector')}
      >
        <ThemedText style={styles.buttonText}>Open Camera</ThemedText>
      </TouchableOpacity>
      
      <ThemedView style={styles.featuresContainer}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedView style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Instant Breed Detection</ThemedText>
          <ThemedText>Powered by Google's Gemini AI</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Works with All Dog Breeds</ThemedText>
          <ThemedText>From Chihuahuas to Great Danes</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Easy to Use</ThemedText>
          <ThemedText>Just point, shoot, and discover!</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  cameraButton: {
    backgroundColor: '#7B4B94',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    gap: 15,
    marginBottom: 30,
  },
  featureItem: {
    gap: 5,
    marginBottom: 10,
  },
  dogImage: {
    height: 250,
    width: '100%',
    bottom: 0,
    position: 'absolute',
    opacity: 0.8,
  },
});
