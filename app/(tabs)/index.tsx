import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#7B4B94', dark: '#3A1D4A' }}
      headerImage={
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
          style={styles.dogImage}
          contentFit="cover"
        />
      }>
      <ThemedView style={styles.heroContainer}>
        <ThemedText type="title" style={styles.title}>Dog Breed Detector</ThemedText>
        <ThemedText style={styles.subtitle}>Your AI-Powered Dog Expert</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.descriptionContainer}>
        <ThemedText style={styles.description}>
          Discover detailed information about any dog breed instantly! Take a photo or choose from your gallery to learn about breed characteristics, temperament, and fun facts.
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => router.push('/breed-detector')}
        >
          <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>Take Photo</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => router.push('/breed-detector?mode=gallery')}
        >
          <Ionicons name="images" size={24} color="white" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>Choose from Gallery</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.featuresContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Key Features</ThemedText>
        
        <ThemedView style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="flash" size={24} color="#7B4B94" />
          </View>
          <View style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Instant Detection</ThemedText>
            <ThemedText>Powered by Google's Gemini AI for accurate breed identification</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="stats-chart" size={24} color="#7B4B94" />
          </View>
          <View style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Detailed Statistics</ThemedText>
            <ThemedText>Get intelligence ranking, energy levels, and more</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="information-circle" size={24} color="#7B4B94" />
          </View>
          <View style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Fun Facts</ThemedText>
            <ThemedText>Learn interesting details about each breed</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="location" size={24} color="#7B4B94" />
          </View>
          <View style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Location Tracking</ThemedText>
            <ThemedText>Optional location tagging for your dog photos</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7B4B94',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#7B4B94',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#3A1D4A',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
    backgroundColor: 'rgba(123, 75, 148, 0.1)',
    padding: 15,
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 75, 148, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  dogImage: {
    height: 300,
    width: '100%',
    bottom: 0,
    position: 'absolute',
    opacity: 0.9,
  },
});
