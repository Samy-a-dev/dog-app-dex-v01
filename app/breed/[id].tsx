import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createShadowStyle } from '@/utils/shadowStyles'; // Assuming this utility exists

// API Configuration - Ensure EXPO_PUBLIC_DOG_API_KEY is in your .env file
const DOG_API_KEY = process.env.EXPO_PUBLIC_DOG_API_KEY;

interface BreedDetails {
  id: string; // This will be the image ID
  url: string; // Image URL
  breeds: Array<{
    id: number | string; // Breed ID
    name: string;
    temperament?: string;
    origin?: string;
    life_span?: string;
    weight?: { imperial: string; metric: string };
    height?: { imperial: string; metric: string };
    bred_for?: string;
    breed_group?: string;
  }>;
}

const { width } = Dimensions.get('window');

export default function BreedDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { id: imageId } = params; // imageId is the reference_image_id

  const [breedDetails, setBreedDetails] = useState<BreedDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      setError('No breed ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchBreedDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        if (DOG_API_KEY) {
          headers['x-api-key'] = DOG_API_KEY;
        } else {
          console.warn("DOG_API_KEY is not set. API calls may fail or be rate-limited.");
        }

        const response = await fetch(`https://api.thedogapi.com/v1/images/${imageId}`, { headers });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText} (Status: ${response.status})`);
        }
        const data: BreedDetails = await response.json();
        setBreedDetails(data);
      } catch (e: any) {
        console.error("Failed to fetch breed details:", e);
        setError(e.message || 'Failed to load breed details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreedDetails();
  }, [imageId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!breedDetails || breedDetails.breeds.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={styles.errorText}>Breed details not found.</Text>
         <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const details = breedDetails.breeds[0];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: details.name || 'Breed Details' }} />
       {/* Custom Header for back button, as Stack.Screen might not show it on modal presentation */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{details.name || 'Breed Details'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: breedDetails.url }} style={styles.breedImage} />
        
        <View style={styles.card}>
          <Text style={styles.breedName}>{details.name}</Text>

          {details.temperament && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Temperament:</Text>
              <Text style={styles.detailValue}>{details.temperament}</Text>
            </View>
          )}

          {details.origin && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Origin:</Text>
              <Text style={styles.detailValue}>{details.origin}</Text>
            </View>
          )}

          {details.life_span && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Life Span:</Text>
              <Text style={styles.detailValue}>{details.life_span}</Text>
            </View>
          )}

          {details.weight?.imperial && details.weight?.metric && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}>{details.weight.imperial} lbs ({details.weight.metric} kg)</Text>
            </View>
          )}

          {details.height?.imperial && details.height?.metric && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Height:</Text>
              <Text style={styles.detailValue}>{details.height.imperial} inches ({details.height.metric} cm)</Text>
            </View>
          )}
          
          {details.bred_for && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bred For:</Text>
              <Text style={styles.detailValue}>{details.bred_for}</Text>
            </View>
          )}

          {details.breed_group && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Breed Group:</Text>
              <Text style={styles.detailValue}>{details.breed_group}</Text>
            </View>
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  breedImage: {
    width: '100%',
    height: width * 0.8, // Make image larger
    resizeMode: 'cover',
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    }),
  },
  breedName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop:10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});