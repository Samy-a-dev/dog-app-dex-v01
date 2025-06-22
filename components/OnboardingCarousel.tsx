import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { setHasSeenOnboarding } from '@/utils/onboarding';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Dogedex',
    description: 'Your ultimate companion for discovering and cataloging dog breeds around the world!',
    image: '🐕‍🦺',
    backgroundColor: ['rgba(255, 107, 107, 0.9)', 'rgba(255, 142, 83, 0.9)'] as const,
    features: ['📱 Smart breed detection', '🌍 Global dog discovery', '🏆 Achievement system'],
  },
  {
    id: '2',
    title: 'AI-Powered Detection',
    description: 'Snap a photo and let our advanced AI instantly identify any dog breed with incredible accuracy.',
    image: '🤖',
    backgroundColor: ['rgba(78, 127, 255, 0.9)', 'rgba(96, 175, 255, 0.9)'] as const,
    features: ['🔍 Instant recognition', '📊 Confidence scoring', '📚 Breed information'],
  },
  {
    id: '3',
    title: 'Build Your Collection',
    description: 'Complete your personal Dogedex with rare breeds, earn XP, and become the ultimate dog expert!',
    image: '🏅',
    backgroundColor: ['rgba(80, 200, 120, 0.9)', 'rgba(117, 225, 161, 0.9)'] as const,
    features: ['🎯 Collect rare breeds', '⭐ Earn experience points', '📈 Track your progress'],
  },
  {
    id: '4',
    title: 'Ready to Explore?',
    description: 'Your dog adventure begins now! Start discovering amazing breeds and building your collection.',
    image: '🚀',
    backgroundColor: ['rgba(147, 112, 219, 0.9)', 'rgba(177, 156, 217, 0.9)'] as const,
    features: ['🎮 Gamified experience', '🌟 Unlock achievements', '🤝 Share discoveries'],
  },
];

export default function OnboardingCarousel() {
  console.log('OnboardingCarousel rendering...');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('OnboardingCarousel useEffect running...');
    // Initial entrance animation
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Animate content when slide changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, scaleAnim]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  const handleSkip = () => {
    const lastIndex = slides.length - 1;
    setCurrentIndex(lastIndex);
    flatListRef.current?.scrollToIndex({ index: lastIndex, animated: true });
  };

  const handleFinish = async () => {
    console.log('Finishing onboarding...');
    try {
      // Exit animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        await setHasSeenOnboarding();
        router.replace('/');
      });
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      router.replace('/');
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    console.log('Rendering slide:', index, item.title);
    
    return (
      <Animated.View 
        style={[
          styles.slide,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={item.backgroundColor}
          style={styles.slideBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.slideContent}>
            {/* Hero Image with Glow Effect */}
            <View style={styles.heroContainer}>
              <View style={styles.heroGlow}>
                <Text style={styles.heroImage}>{item.image}</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.title}>
                {item.title}
              </Text>
              
              <Text style={styles.description}>
                {item.description}
              </Text>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {item.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featurePill}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: scrollX.interpolate({
                    inputRange: [0, (slides.length - 1) * width],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {slides.length}
          </Text>
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const scale = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  console.log('About to render OnboardingCarousel JSX...');

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>OnboardingCarousel Component Loaded</Text>
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false,
            listener: (event: any) => {
              const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentIndex(slideIndex);
            },
          }
        )}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
      />

      {renderPagination()}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => {
                  animateButton();
                  handleNext();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.nextButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <Animated.View style={[styles.finishButtonContainer, { transform: [{ scale: buttonScaleAnim }] }]}>
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={() => {
                animateButton();
                handleFinish();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.finishButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.finishButtonText}>Get Started! 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugText: {
    position: 'absolute',
    top: 20,
    left: 20,
    color: 'red',
  },
  slide: {
    width,
    flex: 1,
  },
  slideBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  heroGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    fontSize: 70,
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: width * 0.85,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  featuresContainer: {
    alignItems: 'center',
    gap: 8,
  },
  featurePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 2,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    alignItems: 'center',
    minWidth: 120,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  finishButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    alignItems: 'center',
    minWidth: 120,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
