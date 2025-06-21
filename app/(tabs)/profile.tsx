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
import { supabase } from '@/lib/supabase'; // Import supabase
import { setHasSeenOnboarding } from '@/utils/onboarding';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [loadingXp, setLoadingXp] = useState(true);

  useEffect(() => {
    const fetchUserXp = async () => {
      console.log('[XP DEBUG] ProfileScreen: fetchUserXp called.');
      if (user) {
        console.log(`[XP DEBUG] ProfileScreen: User found (ID: ${user.id}). Fetching XP.`);
        setLoadingXp(true);
        try {
          const { data, error, status } = await supabase
            .from('user_profiles')
            .select('total_xp')
            .eq('user_id', user.id)
            .single();

          console.log(`[XP DEBUG] ProfileScreen: Supabase response for user_profiles. Data: ${JSON.stringify(data)}, Error: ${JSON.stringify(error)}, Status: ${status}`);

          if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows (single row expected but not found)
            console.error('[XP DEBUG] ProfileScreen: Error fetching user XP from Supabase:', error);
            setTotalXp(0);
          } else if (data) {
            console.log(`[XP DEBUG] ProfileScreen: Successfully fetched XP: ${data.total_xp}. Setting state.`);
            setTotalXp(data.total_xp);
          } else {
            // This case handles PGRST116 (no rows found) or if data is null for other reasons.
            console.log('[XP DEBUG] ProfileScreen: No XP profile data found for user (or error PGRST116). Defaulting totalXp to 0.');
            setTotalXp(0);
          }
        } catch (e) {
          console.error('[XP DEBUG] ProfileScreen: Exception during fetchUserXp:', e);
          setTotalXp(0);
        } finally {
          console.log('[XP DEBUG] ProfileScreen: Finished fetchUserXp try-catch block. Setting loadingXp to false.');
          setLoadingXp(false);
        }
      } else {
        console.log('[XP DEBUG] ProfileScreen: No user found. Setting totalXp to null and loadingXp to false.');
        setTotalXp(null); // No user, no XP
        setLoadingXp(false);
      }
    };

    fetchUserXp();
    // Consider adding a listener for Supabase real-time updates on user_profiles if needed.
    // For example, if XP can be updated from other parts of the app or backend processes.
    // const channel = supabase.channel(`user-profile-${user?.id}`)
    //   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${user?.id}` }, payload => {
    //     setTotalXp((payload.new as { total_xp: number }).total_xp);
    //   })
    //   .subscribe();
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [user]);

  const handleReplayOnboarding = () => {
    Alert.alert(
      'Replay Tutorial',
      'Would you like to view the onboarding screens again?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Replay',
          onPress: async () => {
            // Reset onboarding status (it will be set to true again when user completes onboarding)
            await setHasSeenOnboarding();
            // Navigate to onboarding
            router.push('/onboarding');
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
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
          <Text style={styles.userName}>{user?.email}</Text>
          <Text style={styles.userTitle}>Dog Collector</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Dogs Collected</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Breeds Found</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{loadingXp ? '...' : totalXp ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, styles.highlightedMenuItem]} 
            onPress={handleReplayOnboarding}
          >
            <View style={styles.menuItemRow}>
              <Text style={[styles.menuItemText, {color: '#FF6B6B'}]}>Replay Tutorial</Text>
              <Text style={styles.menuItemIcon}>🔄</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
