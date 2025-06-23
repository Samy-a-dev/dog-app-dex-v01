import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase, getCapturedDogs } from '@/lib/supabase'; // Modified import
import { setHasSeenOnboarding, clearHasSeenOnboarding } from '@/utils/onboarding';

const milestones = [
  { name: 'Dogédex Master', minXp: 10000, level: 5 },
  { name: 'Top Dog', minXp: 5000, level: 4 },
  { name: 'Leash Legend', minXp: 2500, level: 3 },
  { name: 'Pawfessional', minXp: 1000, level: 2 },
  { name: 'Woof Wrangler', minXp: 0, level: 1 },
];

const calculateLevelAndTitle = (xp: number | null): { level: number | null; title: string | null } => {
  if (xp === null || xp < 0) {
    // Default to level 1, Woof Wrangler if XP is null or invalid
    return { level: 1, title: milestones[milestones.length - 1].name };
  }
  for (const milestone of milestones) {
    if (xp >= milestone.minXp) {
      return { level: milestone.level, title: milestone.name };
    }
  }
  // Fallback, though theoretically unreachable if milestones include a 0 minXp entry
  return { level: 1, title: milestones[milestones.length - 1].name };
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [loadingXp, setLoadingXp] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [breedsCollectedCount, setBreedsCollectedCount] = useState<number | null>(null);
  const [loadingBreedsCount, setLoadingBreedsCount] = useState(true);
  const [dogLevel, setDogLevel] = useState<number | null>(null);
  const [userTitle, setUserTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        setLoadingXp(true);
        setLoadingBreedsCount(true);

        // Fetch Total XP
        try {
          console.log(`[XP DEBUG] ProfileScreen: User found (ID: ${user.id}). Fetching XP.`);
          const { data: xpData, error: xpError } = await supabase
            .from('user_profiles')
            .select('total_xp')
            .eq('user_id', user.id)
            .single();

          if (xpError && xpError.code !== 'PGRST116') {
            console.error('[XP DEBUG] ProfileScreen: Error fetching user XP:', xpError);
            setTotalXp(0);
          } else if (xpData) {
            console.log(`[XP DEBUG] ProfileScreen: Successfully fetched XP: ${xpData.total_xp}.`);
            setTotalXp(xpData.total_xp);
          } else {
            console.log('[XP DEBUG] ProfileScreen: No XP profile data found for user. Defaulting totalXp to 0.');
            setTotalXp(0);
          }
        } catch (e) {
          console.error('[XP DEBUG] ProfileScreen: Exception fetching user XP:', e);
          setTotalXp(0);
        } finally {
          setLoadingXp(false);
        }

        // Fetch Breeds Collected Count
        try {
          console.log(`[BREEDS DEBUG] ProfileScreen: Fetching captured dogs for user ID: ${user.id}.`);
          const capturedDogs = await getCapturedDogs(user.id);
          if (capturedDogs && capturedDogs.length > 0) {
            const uniqueBreeds = new Set(capturedDogs.map(dog => dog.breed_name));
            console.log(`[BREEDS DEBUG] ProfileScreen: Found ${uniqueBreeds.size} unique breeds.`);
            setBreedsCollectedCount(uniqueBreeds.size);
          } else {
            console.log(`[BREEDS DEBUG] ProfileScreen: No captured dogs found or empty array.`);
            setBreedsCollectedCount(0);
          }
        } catch (e) {
          console.error('[BREEDS DEBUG] ProfileScreen: Exception fetching captured dogs:', e);
          setBreedsCollectedCount(0);
        } finally {
          setLoadingBreedsCount(false);
        }
      } else {
        // No user
        console.log('[PROFILE DEBUG] ProfileScreen: No user found. Resetting profile states.');
        setTotalXp(null);
        setBreedsCollectedCount(null);
        // setDogLevel(null); // Level/title will be set by the other useEffect based on totalXp
        // setUserTitle(null);
        setLoadingXp(false);
        setLoadingBreedsCount(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Effect to calculate level and title when totalXp changes
  useEffect(() => {
    // if (totalXp !== null) { // This condition means it won't update if totalXp is 0
    const { level, title } = calculateLevelAndTitle(totalXp);
    console.log(`[LEVEL DEBUG] ProfileScreen: Calculated level: ${level}, title: ${title} for XP: ${totalXp}`);
    setDogLevel(level);
    setUserTitle(title);
    // } else {
      // If totalXp is null (e.g., no user), set default level and title from calculateLevelAndTitle
      // const { level, title } = calculateLevelAndTitle(null);
      // setDogLevel(level);
      // setUserTitle(title);
    // }
  }, [totalXp]);

  const handleReplayOnboarding = async () => {
    try {
      await clearHasSeenOnboarding();
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error clearing onboarding state:', error);
      Alert.alert('Error', 'Failed to replay tutorial. Please try again.');
    }
  };

  const confirmReplayOnboarding = () => {
    Alert.alert(
      'Replay Tutorial',
      'Are you sure you want to view the onboarding screens again?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Replay', 
          style: 'default',
          onPress: handleReplayOnboarding 
        },
      ]
    );
  };

  const handleSignOut = async () => {
    console.log("[SIGN_OUT_DEBUG] handleSignOut called");
    setIsSigningOut(true);
    try {
      console.log("[SIGN_OUT_DEBUG] Attempting to clear onboarding status...");
      await clearHasSeenOnboarding();
      console.log("[SIGN_OUT_DEBUG] Onboarding status cleared successfully.");

      console.log("[SIGN_OUT_DEBUG] Attempting to sign out user...");
      // Log user state before sign out
      console.log("[SIGN_OUT_DEBUG] User state before signOut():", user ? user.id : 'null');
      await signOut();
      // Log user state after sign out attempt - user should be null here if successful
      // Note: The user object from this component's scope might not update immediately.
      // The AuthContext's state change will trigger re-renders.
      console.log("[SIGN_OUT_DEBUG] signOut() call completed.");
      console.log("[SIGN_OUT_DEBUG] Sign out process finished in try block. Expecting redirect via useEffect.");
      // The useEffect in AuthProvider or navigation listeners should handle redirection.
    } catch (error) {
      console.error('[SIGN_OUT_DEBUG] Error during sign out process:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      // It's important to set isSigningOut to false only after navigation or if an error occurs.
      // If navigation happens due to user state change, this component might unmount.
      // For now, let's keep it simple and reset it here, but ideally, this is handled carefully
      // depending on navigation flow.
      console.log("[SIGN_OUT_DEBUG] Resetting isSigningOut state in finally block.");
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    console.log('[PROFILE DEBUG] confirmSignOut called');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            console.log('[PROFILE DEBUG] "Sign Out" button in Alert pressed. Calling handleSignOut.');
            handleSignOut();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🐕</Text>
          </View>
          <Text style={styles.userName}>
            {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Dog Lover'}
          </Text>
          <Text style={styles.userTitle}>{loadingXp ? '...' : userTitle ?? 'Dog Collector'}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{loadingBreedsCount ? '...' : breedsCollectedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Breeds Collected</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{loadingXp ? '...' : dogLevel ?? '-'}</Text>
            <Text style={styles.statLabel}>Dog Level</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{loadingXp ? '...' : totalXp ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, styles.highlightedMenuItem]}
            onPress={confirmReplayOnboarding}
          >
            <View style={styles.menuItemRow}>
              <Text style={[styles.menuItemText, {color: '#FF6B6B'}]}>Replay Tutorial</Text>
              <Text style={styles.menuItemIcon}>🔄</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/matcher-profile-edit')}
          >
            <View style={styles.menuItemRow}>
              <Text style={styles.menuItemText}>Edit Matcher Profile</Text>
              <Text style={styles.menuItemIcon}>🐾</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut} // Changed from confirmSignOut to handleSignOut
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out (No Confirmation)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemIcon: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  highlightedMenuItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  signOutButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
