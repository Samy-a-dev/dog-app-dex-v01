import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DogBreedCamera from '../components/DogBreedCamera';

export default function BreedDetectorScreen() {
  const [activeTab, setActiveTab] = useState('detect');

  const tabs = [
    { id: 'detect', title: 'Detect' },
    { id: 'recent', title: 'Recent Finds' },
    { id: 'popular', title: 'Popular Breeds' },
    { id: 'saved', title: 'Saved' }
  ];

  const handleBreedDetected = (breed: string) => {
    console.log('Detected breed:', breed);
    // You can add additional handling here, such as saving to history
  };

  const handleGoBack = () => {
    router.replace('/');
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'detect':
        // Don't wrap DogBreedCamera in any additional view to avoid nested ScrollView issues
        return <DogBreedCamera onBreedDetected={handleBreedDetected} />;
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

