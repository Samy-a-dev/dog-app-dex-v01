import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface ProfileCard {
  user_id: string;
  username: string;
  matcher_dog_image_url: string | null;
  matcher_bio: string | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FindWalkersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentIndex, setCurrentIndex] = useState(0); // Managed by swiper
  const swiperRef = useRef<Swiper<ProfileCard>>(null);

  const fetchProfiles = useCallback(async (fetchLimit: number = 10, isInitialFetch = false) => {
    if (!user) return;
    if (!isInitialFetch) setLoading(true); // Show loading for subsequent fetches if needed, or rely on swiper's empty state
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
        // For react-native-deck-swiper, it's often better to replace the dataset
        // or manage it carefully if appending. For simplicity, let's replace if initial,
        // and append if not, though this might lead to duplicates if not handled by RPC.
        // A more robust solution would be to ensure get_profiles_for_swiping excludes already seen/swiped profiles.
        // For now, we'll append and rely on the swiper's cardKey to handle uniqueness if profiles are re-fetched.
        setProfiles(prevProfiles => {
            const newProfileIds = new Set(data.map((p: ProfileCard) => p.user_id));
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
    if (profiles.length === 0) { // Only fetch initially if profiles array is empty
        fetchProfiles(10, true);
    }
  }, [user, router, fetchProfiles, profiles.length]);


  const handleSwiped = async (cardIndex: number, direction: 'left' | 'right' | 'top' | 'bottom') => {
    const swipedProfile = profiles[cardIndex];
    if (!swipedProfile || !user) {
      console.warn('Swiped on undefined profile or user not available.');
      return;
    }

    console.log(`Swiped ${direction} on profile: ${swipedProfile.user_id} (username: ${swipedProfile.username})`);

    try {
      const { data: swipeResult, error: swipeError } = await supabase.rpc('record_swipe', {
        p_target_user_id: swipedProfile.user_id,
        p_swipe_direction: direction,
      });

      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        // Optionally, inform the user or try to re-queue the swipe
        return; // Stop further processing for this swipe if RPC failed
      }

      console.log('Swipe recorded successfully:', swipeResult);

      // In Phase 3, swipeResult will contain match information.
      // For now, it returns: {status: 'swipe_recorded', target_user_id: ..., swipe_type: ...}
      // Example: if (swipeResult.matched) { Alert.alert("It's a Match!", `You matched with ${swipedProfile.username}`); }

    } catch (e: any) {
      console.error('Exception calling record_swipe:', e);
    }
  };

  const onSwipedAll = () => {
    console.log('Swiped all cards!');
    // Optionally fetch more profiles here or show a "no more profiles" message
    // For now, we'll rely on the refresh button or re-entering the screen.
    // Or, fetch more profiles:
    // fetchProfiles(10); // Fetch another batch
    setError('You have seen all available profiles for now. Try refreshing!');
  };
  
  const renderCard = (cardData: ProfileCard | undefined, cardIndex: number) => {
    if (!cardData) {
      return <View style={styles.card}><ActivityIndicator /></View>; // Or some placeholder
    }
    return (
      <View style={styles.card}>
        {cardData.matcher_dog_image_url ? (
          <Image source={{ uri: cardData.matcher_dog_image_url }} style={styles.dogImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}><Text>No Image</Text></View>
        )}
        <View style={styles.bioContainer}>
          <Text style={styles.usernameText} numberOfLines={1}>{cardData.username || 'User'}</Text>
          <Text style={styles.bioText} numberOfLines={4}>{cardData.matcher_bio || 'No bio provided.'}</Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return <View style={styles.container}><Text>Redirecting...</Text></View>;
  }
  
  if (loading && profiles.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  // Error state when initial fetch fails
  if (error && profiles.length === 0) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchProfiles(10, true)} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
  }
  
  // This handles the case where profiles array is empty after initial load (no error, just no profiles)
  // OR when all profiles have been swiped (swiper's onSwipedAll might have been called)
  // The Swiper component itself will render its own "no more cards" state if cards run out.
  // So, we might not need this specific check if the swiper handles it gracefully.
  // However, if fetchProfiles initially returns empty and sets an error, that's handled above.

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Dog Walking Buddies</Text>
      {profiles.length > 0 ? (
        <Swiper
          ref={swiperRef}
          cards={profiles}
          renderCard={renderCard}
          onSwipedLeft={(cardIndex) => handleSwiped(cardIndex, 'left')}
          onSwipedRight={(cardIndex) => handleSwiped(cardIndex, 'right')}
          onSwipedTop={(cardIndex) => handleSwiped(cardIndex, 'top')} // Or treat as like
          onSwipedBottom={(cardIndex) => handleSwiped(cardIndex, 'bottom')} // Or treat as dislike
          onSwipedAll={onSwipedAll}
          cardIndex={0} // Start from the first card
          backgroundColor={'transparent'} // Make swiper background transparent
          stackSize={3} // Number of cards visible in stack
          stackSeparation={15}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          overlayLabels={{
            bottom: { title: 'NOPE', style: { label: styles.overlayLabelNope, wrapper: styles.overlayWrapper }},
            left: { title: 'NOPE', style: { label: styles.overlayLabelNope, wrapper: styles.overlayWrapper }},
            right: { title: 'LIKE', style: { label: styles.overlayLabelLike, wrapper: styles.overlayWrapper }},
            top: { title: 'SUPER LIKE', style: { label: styles.overlayLabelSuperLike, wrapper: styles.overlayWrapper }},
          }}
          // cardKey="user_id" // Removed as it might not be a valid prop for Swiper component itself
                           // The key for individual cards is handled by React if needed within renderCard,
                           // but Swiper manages its children's identity.
        />
      ) : (
        // This view is shown if profiles array is empty after the initial load attempt (and not loading)
        // It could also be shown if an error occurred and was cleared, but profiles remain empty.
        <View style={styles.centered}>
          <Text>{loading ? 'Loading...' : (error || 'No profiles available right now. Pull down to refresh or try again later.')}</Text>
          {!loading && (
            <TouchableOpacity onPress={() => fetchProfiles(10, true)} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {/* Manual swipe buttons if needed, or remove if only gesture swipe is desired */}
      {profiles.length > 0 && (
        <View style={styles.swipeButtons}>
            <TouchableOpacity onPress={() => swiperRef.current?.swipeLeft()} style={[styles.swipeButton, styles.dislikeButton]}>
                <Text style={styles.swipeButtonText}>NOPE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => swiperRef.current?.swipeRight()} style={[styles.swipeButton, styles.likeButton]}>
                <Text style={styles.swipeButtonText}>LIKE</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    // flex: 1, // Make card take available space in swiper container
    height: SCREEN_WIDTH * 1.3, // Made cards taller
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden', // Ensures image corners are rounded
  },
  dogImage: {
    width: '100%',
    height: '70%', // Adjust image vs bio proportion
  },
  imagePlaceholder: {
    width: '100%',
    height: '70%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1, // Allow bio to take remaining space
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 5,
  },
  bioText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
  },
  swipeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  swipeButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dislikeButton: {
    backgroundColor: '#FF69B4', // Hot Pink
  },
  likeButton: {
    backgroundColor: '#32CD32', // Lime Green
  },
  swipeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
  },
  overlayLabelNope: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#FF69B4', // Hot Pink
    borderColor: '#FF69B4',
    borderWidth: 2,
    padding: 10,
    borderRadius: 10,
  },
  overlayLabelLike: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#32CD32', // Lime Green
    borderColor: '#32CD32',
    borderWidth: 2,
    padding: 10,
    borderRadius: 10,
  },
  overlayLabelSuperLike: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#00BFFF', // Deep Sky Blue
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
  }
});