import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // For a back button icon
import { createShadowStyle } from '@/utils/shadowStyles'; // Assuming this utility exists

// API Configuration - Ensure EXPO_PUBLIC_DOG_API_KEY is in your .env file
const DOG_API_KEY = process.env.EXPO_PUBLIC_DOG_API_KEY;
const DOG_API_SEARCH_URL = 'https://api.thedogapi.com/v1/breeds/search';

interface BreedSearchResult {
  id: string;
  name: string;
  breed_group?: string;
  reference_image_id?: string; // Used to fetch the image
  image_url?: string; // Will be populated after fetching image
}

const { width } = Dimensions.get('window');

export default function SearchBreedsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BreedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch images for breeds that only have reference_image_id
  const fetchImageForBreed = async (referenceImageId: string): Promise<string | undefined> => {
    if (!referenceImageId) return undefined;
    try {
      const headers: HeadersInit = {};
      if (DOG_API_KEY) {
        headers['x-api-key'] = DOG_API_KEY;
      }
      const response = await fetch(`https://api.thedogapi.com/v1/images/${referenceImageId}`, {
        headers,
      });
      if (!response.ok) {
        console.error(`Failed to fetch image ${referenceImageId}: ${response.status}`);
        return undefined;
      }
      const imageData = await response.json();
      return imageData.url;
    } catch (e) {
      console.error(`Error fetching image ${referenceImageId}:`, e);
      return undefined;
    }
  };
  
  // Effect for fetching search results when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        if (DOG_API_KEY) {
          headers['x-api-key'] = DOG_API_KEY;
        }
        const response = await fetch(`${DOG_API_SEARCH_URL}?q=${debouncedQuery}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText} (Status: ${response.status})`);
        }

        const data: BreedSearchResult[] = await response.json();
        
        // Fetch actual image URLs if only reference_image_id is present
        const breedsWithImages = await Promise.all(
          data.map(async (breed) => {
            if (breed.reference_image_id && !breed.image_url) {
              const imageUrl = await fetchImageForBreed(breed.reference_image_id);
              return { ...breed, image_url: imageUrl || 'https://via.placeholder.com/150?text=No+Image' };
            }
            // If the API directly provides an image object with a URL (some endpoints might)
            // else if (breed.image?.url) {
            //   return { ...breed, image_url: breed.image.url };
            // }
            return { ...breed, image_url: breed.image_url || 'https://via.placeholder.com/150?text=No+Image' };
          })
        );

        setSearchResults(breedsWithImages);
        if (breedsWithImages.length === 0) {
          setError('No breeds found matching your search.');
        }
      } catch (e: any) {
        console.error("Failed to fetch search results:", e);
        setError(e.message || 'Failed to fetch breeds. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  const renderBreedItem = ({ item }: { item: BreedSearchResult }) => (
    <View style={styles.breedCard}>
      <Image source={{ uri: item.image_url }} style={styles.breedImage} />
      <Text style={styles.breedName}>{item.name}</Text>
      {item.breed_group && <Text style={styles.breedGroup}>{item.breed_group}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Search Dog Breeds' }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Breeds</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="E.g., Terrier, Bulldog, Poodle..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {isLoading && searchQuery.length > 0 && (
        <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
      )}

      {!isLoading && error && (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && searchResults.length === 0 && debouncedQuery.trim() !== '' && (
         <View style={styles.messageContainer}>
          <Text style={styles.infoText}>No results found for "{debouncedQuery}".</Text>
        </View>
      )}

      {!isLoading && !error && searchResults.length === 0 && debouncedQuery.trim() === '' && (
        <View style={styles.messageContainer}>
          <Text style={styles.infoText}>Type above to search for dog breeds!</Text>
        </View>
      )}
      
      <FlatList
        data={searchResults}
        renderItem={renderBreedItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContentContainer}
        numColumns={2} // Display in two columns
        ListEmptyComponent={() => {
          // This will only show if not loading, no error, and query has been made but returned no results.
          // The initial prompt is handled by the conditions above.
          if (!isLoading && !error && debouncedQuery.trim() !== '' && searchResults.length === 0) {
            return null; // Already handled by the specific "No results found" message
          }
          return null; // Initial prompt handled above
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
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
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    ...createShadowStyle({ // Subtle shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }),
  },
  list: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  breedCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    maxWidth: (width / 2) - 24, // For 2 columns with margins
  },
  breedImage: {
    width: '100%',
    aspectRatio: 1, // Keep it square
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#E0E0E0', // Placeholder background for image
  },
  breedName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  breedGroup: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    marginTop: 30,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});