import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DogBreedCamera from '../components/DogBreedCamera';
import { useAuth } from '@/contexts/AuthContext';
import { saveCapturedDog } from '@/lib/supabase';

export default function BreedDetectorScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('detect');
  const [detectedBreed, setDetectedBreed] = useState<string | null>(null);
  const [detectedLikeness, setDetectedLikeness] = useState<number | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<any>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'detect', title: 'Detect' },
    { id: 'recent', title: 'Recent Finds' },
    { id: 'popular', title: 'Popular Breeds' },
    { id: 'saved', title: 'Saved' }
  ];

  const handleBreedDetected = (breed: string, funFact?: string, likeness?: number, location?: any, imageUri?: string) => {
    console.log('Detected breed:', breed, 'Image URI:', imageUri);
    setDetectedBreed(breed);
    setDetectedLikeness(likeness || null);
    setDetectedLocation(location || null);
    setCurrentImageUri(imageUri || null);
  };

  const handleGoBack = () => {
    router.replace('/');
  };

  const handleSaveImage = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save images');
      return;
    }

    if (!currentImageUri || !detectedBreed || !detectedLocation) {
      Alert.alert('Cannot Save', 'Missing required information to save the image');
      return;
    }

    setIsSaving(true);
    try {
      const timestamp = detectedLocation.timestamp || Date.now();
      const savedDog = await saveCapturedDog(
        user.id,
        currentImageUri,
        detectedBreed,
        detectedLikeness || 0,
        detectedLocation,
        timestamp,
        'Unknown' // Default rarity if not provided
      );

      if (savedDog) {
        Alert.alert('Success', 'Image saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save the image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'An error occurred while saving the image');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'detect':
        // Don't wrap DogBreedCamera in any additional view to avoid nested ScrollView issues
        return (
          <>
            <DogBreedCamera 
              onBreedDetected={handleBreedDetected} 
            />
            {currentImageUri && detectedBreed && (
              <View className="w-full flex items-center mt-4">
                <TouchableOpacity 
                  onPress={handleSaveImage}
                  disabled={isSaving}
                  className="bg-[#7B4B94] py-3 px-6 rounded-full flex-row items-center justify-center">
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">
                    {isSaving ? 'Saving...' : 'Save Image'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        );
      case 'recent':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{padding: 16, alignItems: 'center', justifyContent: 'center'}}>
            <Text className="text-white text-lg">Your recent dog breed discoveries will appear here</Text>
          </ScrollView>
        );
      case 'popular':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{padding: 16, alignItems: 'center', justifyContent: 'center'}}>
            <Text className="text-white text-lg">Popular dog breeds will appear here</Text>
          </ScrollView>
        );
      case 'saved':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{padding: 16, alignItems: 'center', justifyContent: 'center'}}>
            <Text className="text-white text-lg">Your saved dog breeds will appear here</Text>
          </ScrollView>
        );
      default:
        return <DogBreedCamera onBreedDetected={handleBreedDetected} />;
    }
  };

  return (
    <View className="flex-1 bg-black">
      <TouchableOpacity 
        onPress={handleGoBack}
        className="absolute top-12 left-4 z-10 bg-[#7B4B94] rounded-full p-2"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      {/* Horizontal Tab Navigation */}
      <View className="mt-16 mb-2">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4"
        >
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-4 py-2 mr-2 rounded-full ${activeTab === tab.id ? 'bg-[#7B4B94]' : 'bg-gray-800'}`}
            >
              <Text 
                className={`font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content - No extra wrapping View for DogBreedCamera to avoid nested ScrollView issues */}
      {renderTabContent()}

    </View>
  );
}

