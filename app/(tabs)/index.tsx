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
  Image,
  ActivityIndicator // Added
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

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
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/shadowStyles';
import XPDisplayCard from '@/components/XPDisplayCard'; // Added import

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
const router = useRouter();
  const [exploreBreedsData, setExploreBreedsData] = useState<Breed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (e: any) {
        console.error("Failed to fetch breeds:", e);
        setError(e.message || 'Failed to fetch breeds. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  const handleSeeAll = () => {
    router.push('/searchBreeds');
  };

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
{/* Explore Breeds Section */}
        <View style={styles.exploreBreedsContainer}>
          <View style={styles.exploreHeader}>
            <Text style={styles.exploreTitle}>Explore Breeds</Text>
            <TouchableOpacity onPress={handleSeeAll}>
              <Text style={styles.seeAllText}>See All &gt;</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exploreList}>
              {exploreBreedsData.map(breed => (
                <TouchableOpacity
                  key={breed.id}
                  style={styles.exploreBreedCardTouchable} // Using a separate style for the touchable if needed, or reuse exploreBreedCard
                  onPress={() => {
                    if (breed.reference_image_id) {
                      router.push(`/breed/${breed.reference_image_id}`);
                    } else {
                      console.warn("Missing reference_image_id for breed on home screen:", breed.name);
                      // Optionally, alert the user or disable interaction
                    }
                  }}
                >
                  <View style={[styles.exploreBreedCard, { backgroundColor: breed.backgroundColor }]}>
                    <Image source={{ uri: breed.image_url }} style={styles.breedImage} />
                    <Text style={styles.breedPrimaryName} numberOfLines={1} ellipsizeMode="tail">{breed.name}</Text>
                    {breed.breed_group && <Text style={styles.breedSecondaryName} numberOfLines={1} ellipsizeMode="tail">{breed.breed_group}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

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
exploreBreedsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 5, // Slight horizontal padding for the header
  },
  exploreTitle: {
    fontSize: 22, // Slightly larger than sectionTitle
    fontWeight: 'bold',
    color: '#2c3e50', // Darker, more prominent color
  },
  seeAllText: {
    fontSize: 16,
    color: '#3498db', // A distinct color for links
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  exploreList: {
    paddingLeft: 5, // Start cards slightly indented
    paddingRight: 15, // Ensure last card has some space
  },
exploreBreedCardTouchable: {
    // Ensures the touchable area matches the card's visual dimensions and layout needs
    width: width * 0.35,
    height: width * 0.45,
    marginRight: 15,
    borderRadius: 12, // Match card's border radius for consistent touch feedback
    // Note: backgroundColor and shadow are applied to the inner View (exploreBreedCard)
  },
  exploreBreedCard: {
    width: width * 0.35, // Adjust card width to show ~2.5 cards
    height: width * 0.45, // Adjust height to be a bit taller
    borderRadius: 12,
    marginRight: 15,
    padding: 10,
    justifyContent: 'space-between', // Distribute space for image and text
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    }),
  },
  breedImage: {
    width: '100%',
    height: '60%', // Image takes up more space
    borderRadius: 8,
    marginBottom: 8,
  },
  breedPrimaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  breedSecondaryName: {
    fontSize: 13,
    fontWeight: 'bold', // Make it bold as per design
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
});
