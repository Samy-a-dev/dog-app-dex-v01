import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, SafeAreaView, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DogBreedCamera from '../components/DogBreedCamera';
import { createShadowStyle } from '@/utils/shadowStyles';

const { width, height } = Dimensions.get('window');

export default function BreedDetectorScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const [isScanning, setIsScanning] = useState(false);
  const [breedDetected, setBreedDetected] = useState(false);
  
  // Scanning animation refs
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanPulseAnim = useRef(new Animated.Value(0)).current;
  const scanRotateAnim = useRef(new Animated.Value(0)).current;
  const scanOpacityAnim = useRef(new Animated.Value(0)).current;
  const homeButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Scanning animation effect
  useEffect(() => {
    if (isScanning) {
      // Show scanning overlay
      Animated.timing(scanOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scanning line animation
      const scanLineAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotate animation
      const rotateAnimation = Animated.loop(
        Animated.timing(scanRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      scanLineAnimation.start();
      pulseAnimation.start();
      rotateAnimation.start();

      return () => {
        scanLineAnimation.stop();
        pulseAnimation.stop();
        rotateAnimation.stop();
      };
    } else {
      // Hide scanning overlay
      Animated.timing(scanOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isScanning, scanLineAnim, scanPulseAnim, scanRotateAnim, scanOpacityAnim]);

  useEffect(() => {
    if (breedDetected) {
      Animated.timing(homeButtonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(homeButtonAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [breedDetected, homeButtonAnim]);

  const handleBreedDetected = (breed: string) => {
    console.log('Detected breed:', breed);
    setIsScanning(false); // Stop scanning animation when detection completes
    setBreedDetected(true);
    // You can add additional handling here, such as saving to history
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoToHome = () => {
    router.replace('/');
  };

  // Monitor when scanning starts (this would be triggered by DogBreedCamera)
  const handleScanStart = () => {
    setIsScanning(true);
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
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.backButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Breed Detector</Text>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Camera Content */}
        <Animated.View 
          style={[
            styles.cameraContainer,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <DogBreedCamera 
            onBreedDetected={handleBreedDetected}
            onScanStart={handleScanStart}
          />
        </Animated.View>

        {/* Scanning Animation Overlay */}
        <Animated.View 
          style={[
            styles.scanningOverlay,
            {
              opacity: scanOpacityAnim,
            }
          ]}
          pointerEvents={isScanning ? 'auto' : 'none'}
        >
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />
            
            {/* Scanning line */}
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 280],
                    })
                  }]
                }
              ]}
            />
          </View>

          {/* Pulse circles */}
          <Animated.View 
            style={[
              styles.pulseCircle,
              {
                opacity: scanPulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 0.3, 0],
                }),
                transform: [{
                  scale: scanPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.5],
                  })
                }]
              }
            ]}
          />

          {/* Rotating scanner */}
          <Animated.View 
            style={[
              styles.rotatingScanner,
              {
                transform: [{
                  rotate: scanRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }
            ]}
          >
            <View style={styles.scannerLine} />
          </Animated.View>

          {/* Scanning text */}
          <View style={styles.scanningTextContainer}>
            <Text style={styles.scanningText}>🔍 Analyzing Dog Breed...</Text>
            <Animated.View 
              style={[
                styles.loadingDots,
                {
                  opacity: scanPulseAnim,
                }
              ]}
            >
              <Text style={styles.loadingDotsText}>• • •</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Back to Home Button */}
        {breedDetected && (
          <Animated.View 
            style={[
              styles.backToHomeButton,
              {
                opacity: homeButtonAnim,
                transform: [{
                  translateY: homeButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleGoToHome}
              style={styles.backToHomeButtonInner}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#3e8e41']}
                style={styles.backToHomeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.backToHomeButtonText}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
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
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
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
  backButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 45, // Same width as back button for centering
  },
  cameraContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  // Scanning Animation Styles
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scanFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00ff88',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  pulseCircle: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  rotatingScanner: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerLine: {
    position: 'absolute',
    width: 2,
    height: '50%',
    backgroundColor: '#ff6b6b',
    top: 0,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  scanningTextContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingDots: {
    marginTop: 10,
  },
  loadingDotsText: {
    fontSize: 24,
    color: '#00ff88',
    textAlign: 'center',
    letterSpacing: 8,
  },
  backToHomeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  backToHomeButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToHomeButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  backToHomeButtonText: {
    fontSize: 18,
    color: 'white',
  },
});
