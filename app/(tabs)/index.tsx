import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/shadowStyles';
import XPDisplayCard from '@/components/XPDisplayCard'; // Added import

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();

  const dogBreeds = [
    { id: 1, name: 'Golden Retriever', emoji: '🦮', collected: false },
    { id: 2, name: 'German Shepherd', emoji: '🐕‍🦺', collected: false },
    { id: 3, name: 'Bulldog', emoji: '🐶', collected: false },
    { id: 4, name: 'Poodle', emoji: '🐩', collected: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/company-logo-name.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.cardTitle}>Welcome to Dogedex!</Text>
          <Text style={styles.cardDescription}>
            Start your journey to discover and collect different dog breeds from around the world.
          </Text>
        </View>

        <XPDisplayCard /> {/* Added XP Display Card */}

        <View style={styles.breedsSection}>
          <Text style={styles.sectionTitle}>Popular Breeds</Text>
          <View style={styles.breedsGrid}>
            {dogBreeds.map((breed) => (
              <TouchableOpacity key={breed.id} style={styles.breedCard}>
                <Text style={styles.breedEmoji}>{breed.emoji}</Text>
                <Text style={styles.breedName}>{breed.name}</Text>
                <View style={[styles.collectButton, breed.collected && styles.collected]}>
                  <Text style={[styles.collectButtonText, breed.collected && styles.collectedText]}>
                    {breed.collected ? 'Collected' : 'Collect'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.exploreButton}>
          <View
            style={styles.exploreButtonGradient}
          >
            <Text style={styles.exploreButtonText}>Start Exploring</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breedsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  breedsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  breedCard: {
    width: (width - 80) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  breedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  breedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  collectButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  collected: {
    backgroundColor: '#4CAF50',
  },
  collectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  collectedText: {
    color: 'white',
  },
  exploreButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
  },
  exploreButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
