import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pawOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      
      // Paw prints appear
      Animated.timing(pawOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      // Text appears
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // Wait a bit
      Animated.delay(800),
    ]);

    // Animated dots
    const dotAnimations = dotsAnimation.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Start animations
    sequence.start();
    dotAnimations.forEach(animation => animation.start());

    // Finish after 3.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => {
      clearTimeout(timer);
      dotAnimations.forEach(animation => animation.stop());
    };
  }, [dotsAnimation, logoOpacity, logoScale, onFinish, pawOpacity, textOpacity]);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Animated paw prints */}
      <Animated.Text 
        style={[
          styles.pawPrint, 
          styles.paw1,
          { opacity: pawOpacity }
        ]}
      >
        🐾
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.pawPrint, 
          styles.paw2,
          { opacity: pawOpacity }
        ]}
      >
        🐾
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.pawPrint, 
          styles.paw3,
          { opacity: pawOpacity }
        ]}
      >
        🐾
      </Animated.Text>

      {/* Main content */}
      <View style={styles.textContainer}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image 
            source={require('@/assets/images/company-logo-name.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.appName}>Welcome to Dogedex</Text>
          <Text style={styles.loadingText}>Loading your pup-tastic experience</Text>
          
          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            {dotsAnimation.map((dot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity: dot,
                    transform: [
                      {
                        scale: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pawPrint: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.6,
  },
  paw1: {
    top: height * 0.25,
    left: width * 0.15,
    transform: [{ rotate: '-15deg' }],
  },
  paw2: {
    top: height * 0.35,
    right: width * 0.2,
    transform: [{ rotate: '30deg' }],
  },
  paw3: {
    bottom: height * 0.3,
    left: width * 0.25,
    transform: [{ rotate: '-45deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.28,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 4,
  },
});
