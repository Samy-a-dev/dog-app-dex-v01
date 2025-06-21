import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DogBreedCamera from '../components/DogBreedCamera';

export default function BreedDetectorScreen() {
  const handleBreedDetected = (breed: string) => {
    console.log('Detected breed:', breed);
    // You can add additional handling here, such as saving to history
  };

  const handleGoBack = () => {
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-black">
      <TouchableOpacity 
        onPress={handleGoBack}
        className="absolute top-12 left-4 z-10 bg-[#7B4B94] rounded-full p-2"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <DogBreedCamera onBreedDetected={handleBreedDetected} />
    </View>
  );
}

