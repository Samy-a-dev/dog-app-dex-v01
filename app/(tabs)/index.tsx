import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { createShadowStyle } from '@/utils/shadowStyles';
import XPDisplayCard from '@/components/XPDisplayCard';

// TODO: Move this API key to a .env file for security
const DOG_API_KEY = 'live_jwnKEXgZxbyQwUMZy1yCL3uZ53Qglc8OMUewDlEM5r8ypWH5NDqmYvwVJYr4IqGY';
const DOG_API_URL = 'https://api.thedogapi.com/v1/breeds';

const cardBackgroundColors = ['#FEF4E7', '#EBF7FA', '#E6F8F3'];

interface Breed {
  id: string;
  name: string;
  breed_group?: string;
  image_url: string;
  backgroundColor: string;
  reference_image_id?: string; // Added for navigation to detail screen
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [exploreBreedsData, setExploreBreedsData] = useState<Breed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchBreeds = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${DOG_API_URL}?limit=4`, {
          headers: {
            'x-api-key': DOG_API_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        // Ensure data is an array before mapping
        if (!Array.isArray(data)) {
          console.error("API did not return an array:", data);
          throw new Error('Unexpected data format from API.');
        }
        const formattedBreeds = data.map((breed: any, index: number) => ({
          id: breed.id,
          name: breed.name,
          breed_group: breed.breed_group,
          image_url: breed.image?.url || 'https://via.placeholder.com/150', // Fallback image
          backgroundColor: cardBackgroundColors[index % cardBackgroundColors.length],
          reference_image_id: breed.reference_image_id, // Added
        }));
        setExploreBreedsData(formattedBreeds);
        
        // Animate cards after data loads
        Animated.timing(cardsAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } catch (e: any) {
        console.error("Failed to fetch breeds:", e);
        setError(e.message || 'Failed to fetch breeds. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreeds();
  }, [cardsAnimation]);

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  const handleSeeAll = () => {
    router.push('/searchBreeds');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: logoScale }],
            }}
          >
            <Image 
              source={require('@/assets/images/company-logo-name.png')} 
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Dogedex logo"
            />
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.profileButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.profileButtonText}>👤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome Card */}
          <Animated.View 
            style={[
              styles.welcomeCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.welcomeCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardTitle}>Welcome to Dogedex! 🐕</Text>
              <Text style={styles.cardDescription}>
                Start your journey to discover and collect different dog breeds from around the world.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* XP Display Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <XPDisplayCard />
          </Animated.View>

          {/* Explore Breeds Section */}
          <Animated.View 
            style={[
              styles.exploreBreedsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.exploreHeader}>
              <Text style={styles.exploreTitle}>Explore Breeds ✨</Text>
              <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllButton}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.seeAllGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.seeAllText}>See All →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.loadingText}>Fetching adorable breeds...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[
                  styles.exploreList,
                  {
                    opacity: cardsAnimation,
                    transform: [
                      {
                        translateX: cardsAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  }
                ]}
                contentContainerStyle={styles.exploreListContent}
              >
                {exploreBreedsData.map((breed, index) => (
                  <Animated.View
                    key={breed.id}
                    style={[
                      styles.exploreBreedCardTouchable,
                      {
                        transform: [
                          {
                            scale: cardsAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                      }
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => router.push('/searchBreeds')}
                      activeOpacity={0.8}
                      style={{ flex: 1 }}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                        style={styles.exploreBreedCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Image
                          source={{ uri: breed.image_url }}
                          style={styles.breedImage}
                          resizeMode="cover"
                        />
                        <View style={styles.breedInfo}>
                          <Text style={styles.breedPrimaryName} numberOfLines={1}>
                            {breed.name}
                          </Text>
                          {breed.breed_group && (
                            <Text style={styles.breedSecondaryName} numberOfLines={1}>
                              {breed.breed_group}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.ScrollView>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.2,
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  welcomeCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    }),
  },
  welcomeCardGradient: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    textAlign: 'center',
  },
  exploreBreedsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  seeAllButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  seeAllGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  loader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  exploreList: {
    marginHorizontal: -5,
  },
  exploreListContent: {
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  exploreBreedCardTouchable: {
    width: width * 0.65,
    height: width * 0.8,
    marginRight: 15,
  },
  exploreBreedCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    }),
  },
  breedImage: {
    width: '100%',
    height: '75%',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  breedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  breedPrimaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 2,
  },
  breedSecondaryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
