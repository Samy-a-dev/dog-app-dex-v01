import React from 'react';
import { StyleSheet, View } from 'react-native';
import DogBreedCamera from '../components/DogBreedCamera';

export default function BreedDetectorScreen() {
  const handleBreedDetected = (breed: string) => {
    console.log('Detected breed:', breed);
    // You can add additional handling here, such as saving to history
  };

  return (
    <View style={styles.container}>
      <DogBreedCamera onBreedDetected={handleBreedDetected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
