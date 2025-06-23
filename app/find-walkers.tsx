import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity, Alert, Animated, SafeAreaView } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface ProfileCard {
  user_id: string;
  username: string;
  matcher_dog_image_url: string | null;
  matcher_bio: string | null;
}

interface RecordSwipeArgs {
  p_target_user_id: string;
  p_swipe_direction: 'like' | 'nope';
}

interface SwipeResponse {
  status: 'match_created' | 'swipe_recorded' | 'error';
  message: string;
  swiper_user_id?: string;
  target_user_id?: string;
  swipe_type?: 'like' | 'nope';
  matched_user_id?: string;
  matched_username?: string;
  matched_dog_image_url?: string;
}

interface CreateOrGetChatRoomArgs {
  p_user_id_1: string;
  p_user_id_2: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FindWalkersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<Swiper<ProfileCard>>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fetchProfiles = useCallback(async (fetchLimit: number = 10, isInitialFetch = false) => {
    if (!user) return;
    if (!isInitialFetch) setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_profiles_for_swiping', {
        fetch_limit: fetchLimit,
      });

      if (rpcError) {
        throw rpcError;
      }
      
      console.log('Fetched profiles:', data);
      if (data && data.length > 0) {
        setProfiles(prevProfiles => {
            const uniqueNewProfiles = data.filter((p: ProfileCard) => !prevProfiles.find(pp => pp.user_id === p.user_id));
            return [...prevProfiles, ...uniqueNewProfiles];
        });
      } else if (isInitialFetch && profiles.length === 0) {
        setError('No new profiles found at the moment. Try again later!');
      }
      
    } catch (e: any) {
      console.error('Error fetching profiles for swiping:', e);
      setError(`Failed to load profiles: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [user, profiles.length]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (profiles.length === 0) {
        fetchProfiles(10, true);
    }
  }, [user, router, fetchProfiles, profiles.length]);

  const animateButton = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSwiped = async (cardIndex: number, direction: 'left' | 'right' | 'top' | 'bottom') => {
    const swipedProfile = profiles[cardIndex];
    if (!swipedProfile || !user) {
      console.warn('Swiped on undefined profile or user not available.');
      return;
    }

    if (direction === 'right') {
      animateHeart();
    }

    const swipeDirection = direction === 'right' ? 'like' : 'nope';
    console.log(`Swiped ${swipeDirection} on ${swipedProfile.username} (${swipedProfile.user_id})`);

    try {
      const { data, error: rpcError } = await supabase.rpc('record_swipe', {
        p_target_user_id: swipedProfile.user_id,
        p_swipe_direction: swipeDirection,
      } as RecordSwipeArgs);

      if (rpcError) {
        throw rpcError;
      }

      const response = data as SwipeResponse;
      console.log('Swipe response:', response);

      if (response.status === 'match_created') {
        Alert.alert(
          '🎉 It\'s a Match!',
          `You and ${response.matched_username || swipedProfile.username} liked each other!`,
          [
            {
              text: 'Keep Swiping',
              style: 'cancel',
            },
            {
              text: 'Start Chatting',
              onPress: async () => {
                try {
                  const { data: chatRoomId, error: chatError } = await supabase.rpc('create_or_get_chat_room', {
                    p_user_id_1: user.id,
                    p_user_id_2: swipedProfile.user_id,
                  } as CreateOrGetChatRoomArgs);

                  if (chatError) {
                    throw chatError;
                  }

                  if (chatRoomId) {
                    router.push(`/chat/${chatRoomId}` as any);
                  } else {
                    Alert.alert('Error', 'Failed to create chat room. Please try again.');
                  }
                } catch (chatErr: any) {
                  console.error('Error creating chat room:', chatErr);
                  Alert.alert('Error', `Failed to start chat: ${chatErr.message}`);
                }
              },
            },
          ]
        );
      }
    } catch (e: any) {
      console.error('Error recording swipe:', e);
      Alert.alert('Error', `Failed to record swipe: ${e.message}`);
    }

    if (profiles.length - cardIndex <= 3) {
      fetchProfiles(5, false);
    }
  };

  const onSwipedAll = () => {
    console.log('All cards swiped');
    fetchProfiles(10, false);
  };

  const renderCard = (cardData: ProfileCard | undefined, cardIndex: number) => {
    if (!cardData) {
      return (
        <View style={styles.card}>
          <View style={styles.imagePlaceholder}>
            <Text>No Profile Data</Text>
          </View>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.cardImageContainer}>
          {cardData.matcher_dog_image_url ? (
            <Image source={{ uri: cardData.matcher_dog_image_url }} style={styles.dogImage} />
          ) : (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.imagePlaceholder}
            >
              <Ionicons name="paw" size={60} color="white" />
              <Text style={styles.placeholderText}>No Photo</Text>
            </LinearGradient>
          )}
          
          {/* Gradient overlay for better text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardOverlay}
          />
          
          {/* User info overlay */}
          <View style={styles.cardInfo}>
            <Text style={styles.usernameText}>{cardData.username}</Text>
            {cardData.matcher_bio && (
              <Text style={styles.bioText} numberOfLines={3}>
                {cardData.matcher_bio}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading && profiles.length === 0) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Finding amazing dog walkers...</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
            <Ionicons name="sad-outline" size={80} color="white" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => fetchProfiles(10, true)}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.refreshButtonGradient}
              >
                <Text style={styles.refreshButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Find Dog Walkers</Text>
          <Text style={styles.headerSubtitle}>Swipe to connect with fellow dog lovers</Text>
        </Animated.View>

        {/* Floating heart animation */}
        <Animated.View 
          style={[
            styles.floatingHeart,
            {
              opacity: heartAnim,
              transform: [
                {
                  scale: heartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
                {
                  translateY: heartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={60} color="#FF69B4" />
        </Animated.View>

        {/* Card Stack */}
        <View style={styles.cardContainer}>
          {profiles.length > 0 ? (
            <Swiper
              ref={swiperRef}
              cards={profiles}
              renderCard={renderCard}
              onSwiped={(cardIndex: number) => {
                // We need to determine direction from the swiper's internal state
                // For now, we'll handle this differently since the swiper doesn't provide direction
                console.log('Card swiped at index:', cardIndex);
              }}
              onSwipedLeft={(cardIndex: number) => handleSwiped(cardIndex, 'left')}
              onSwipedRight={(cardIndex: number) => handleSwiped(cardIndex, 'right')}
              onSwipedTop={(cardIndex: number) => handleSwiped(cardIndex, 'top')}
              onSwipedAll={onSwipedAll}
              cardIndex={0}
              backgroundColor="transparent"
              stackSize={3}
              stackScale={10}
              stackSeparation={15}
              animateOverlayLabelsOpacity
              animateCardOpacity
              swipeBackCard
              overlayLabels={{
                left: {
                  title: 'NOPE',
                  style: {
                    label: styles.overlayLabelNope,
                    wrapper: styles.overlayWrapper,
                  },
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: styles.overlayLabelLike,
                    wrapper: styles.overlayWrapper,
                  },
                },
                top: {
                  title: 'SUPER LIKE',
                  style: {
                    label: styles.overlayLabelSuperLike,
                    wrapper: styles.overlayWrapper,
                  },
                },
              }}
              cardVerticalMargin={20}
              cardHorizontalMargin={20}
            />
          ) : (
            <Animated.View style={[styles.noCardsContainer, { opacity: fadeAnim }]}>
              <Ionicons name="paw-outline" size={100} color="rgba(255,255,255,0.7)" />
              <Text style={styles.noCardsText}>No more profiles to show</Text>
              <Text style={styles.noCardsSubtext}>Check back later for new dog walkers!</Text>
            </Animated.View>
          )}
        </View>

        {/* Action Buttons */}
        {profiles.length > 0 && (
          <Animated.View 
            style={[
              styles.actionButtons,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  animateButton(buttonScaleAnim);
                  swiperRef.current?.swipeLeft();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="close" size={30} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.superLikeButton]}
                onPress={() => {
                  animateButton(buttonScaleAnim);
                  swiperRef.current?.swipeTop();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00BFFF', '#0080FF']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="star" size={25} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  animateButton(buttonScaleAnim);
                  animateHeart();
                  swiperRef.current?.swipeRight();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="heart" size={30} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImageContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  dogImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: 'white',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  bioText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeButton: {
    backgroundColor: '#00BFFF',
  },
  floatingHeart: {
    position: 'absolute',
    top: 50,
    left: SCREEN_WIDTH / 2 - 30,
  },
  noCardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCardsText: {
    fontSize: 20,
    color: 'white',
  },
  noCardsSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  overlayLabelNope: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#FF69B4',
    borderColor: '#FF69B4',
    borderWidth: 2,
    padding: 10,
    borderRadius: 10,
  },
  overlayLabelLike: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#32CD32',
    borderColor: '#32CD32',
    borderWidth: 2,
    padding: 10,
    borderRadius: 10,
  },
  overlayLabelSuperLike: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#00BFFF',
    borderColor: '#00BFFF',
    borderWidth: 2,
    padding: 10,
    borderRadius: 10,
  },
  overlayWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 10,
  },
  refreshButtonGradient: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: 'white',
  },
});