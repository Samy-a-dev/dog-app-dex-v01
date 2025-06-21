import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getCapturedDogs } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CapturedDog {
  id: string;
  image_url: string;
  breed_name: string;
  timestamp: string;
  rarity: string;
  likeness: number;
}

export default function DogedexScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [capturedDogs, setCapturedDogs] = useState<CapturedDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDogs = async () => {
    console.log('Dogedex: fetchDogs called. User:', user ? user.id : 'No user');
    if (!user) {
      console.log('Dogedex: No user, clearing dogs and stopping loading.');
      setCapturedDogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log('Dogedex: Fetching dogs for user ID:', user.id);
    try {
      const dogs = await getCapturedDogs(user.id);
      console.log('Dogedex: Fetched dogs data:', JSON.stringify(dogs, null, 2));
      setCapturedDogs(dogs);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch captured dogs.';
      setError(errorMessage);
      console.error('Dogedex: Error in fetchDogs:', errorMessage, e);
    } finally {
      setLoading(false);
      console.log('Dogedex: fetchDogs finished.');
    }
  };

  useEffect(() => {
    console.log('Dogedex: useEffect triggered. User state:', user ? user.id : 'No user');
    fetchDogs();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDogs();
    setRefreshing(false);
  };

  const renderDogItem = ({ item }: { item: CapturedDog }) => {
    console.log('Dogedex: Rendering dog item. Image URL:', item.image_url, 'Breed:', item.breed_name);
    return (
      <View style={[styles.dogItem, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].icon, borderWidth: colorScheme === 'dark' ? 1 : 0  }]}>
      <Image
        source={{ uri: item.image_url }}
        style={[styles.dogImage, { backgroundColor: 'yellow' }]} // Temporary yellow background
        resizeMode="cover"
        onError={(e) => console.log('Dogedex: Image load error for', item.image_url, e.nativeEvent.error)}
      />
      <View style={styles.dogInfo}>
        <Text style={[styles.breedName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.breed_name || 'Unknown Breed'}</Text>
        <Text style={[styles.captureDate, { color: Colors[colorScheme ?? 'light'].icon }]}>
          Captured: {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        {item.rarity && <Text style={[styles.dogDetail, { color: Colors[colorScheme ?? 'light'].icon }]}>Rarity: {item.rarity}</Text>}
        {item.likeness !== null && <Text style={[styles.dogDetail, { color: Colors[colorScheme ?? 'light'].icon }]}>Confidence: {item.likeness}%</Text>}
      </View>
    </View>
  );
}; // Closing brace for renderDogItem

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={{ color: Colors[colorScheme ?? 'light'].icon, marginTop: 10 }}>Loading your Dogedex...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: '#D32F2F' }]}>Error: {error}</Text> {/* Using a hardcoded red for error text */}
        <Text style={{ color: Colors[colorScheme ?? 'light'].icon }}>Please try again later.</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].icon }]}>Please log in to see your Dogedex.</Text>
      </SafeAreaView>
    );
  }
  
  if (capturedDogs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].icon }]}>No dogs captured yet. Go find some! 🐾</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={capturedDogs}
        renderItem={renderDogItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[colorScheme ?? 'light'].tint} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  dogItem: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden', // Ensures image corners are rounded
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dogImage: {
    width: '100%',
    aspectRatio: 1, // Square images
  },
  dogInfo: {
    padding: 12,
  },
  breedName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  captureDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  dogDetail: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
  },
})