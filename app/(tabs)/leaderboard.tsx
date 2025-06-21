import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createShadowStyle } from '@/utils/shadowStyles';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  rank: number;
  username: string;
  email: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      
      // First, let's try to get leaderboard data - check if table exists
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          total_xp
        `)
        .order('total_xp', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching leaderboard:', fetchError);
        
        // If table doesn't exist, create some test data
        if (fetchError.code === '42P01') {
          setError('Leaderboard table not found. Setting up test data...');
          await createTestData();
          return;
        }
        
        setError(fetchError.message);
        return;
      }

      if (!data || data.length === 0) {
        // Create test data if no users exist
        await createTestData();
        return;
      }

      // Get user emails and create usernames
      const leaderboardWithDetails = await Promise.all(
        data.map(async (entry, index) => {
          // Try to get user email from auth.users (may not work with RLS)
          let email = 'anonymous@example.com';
          let username = `Player ${index + 1}`;
          
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user && userData.user.id === entry.user_id) {
              email = userData.user.email || email;
              username = userData.user.user_metadata?.full_name || 
                        userData.user.user_metadata?.name || 
                        email.split('@')[0] ||
                        username;
            }
          } catch (e) {
            // Use fallback values
          }

          return {
            ...entry,
            rank: index + 1,
            username,
            email,
          };
        })
      );

      setLeaderboard(leaderboardWithDetails);
    } catch (error) {
      console.error('Exception fetching leaderboard:', error);
      setError('Failed to load leaderboard');
    }
  };

  const createTestData = async () => {
    try {
      console.log('Creating test leaderboard data...');
      
      // Create some test scores for demonstration
      const testUsers = [
        { username: 'Top Dog Hunter', total_xp: 1250 },
        { username: 'Breed Master', total_xp: 980 },
        { username: 'Pup Collector', total_xp: 875 },
        { username: 'Doggo Finder', total_xp: 720 },
        { username: 'Canine Expert', total_xp: 650 },
      ];

      // Add current user if logged in
      if (user) {
        testUsers.push({
          username: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0] || 
                   'You',
          total_xp: Math.floor(Math.random() * 500) + 100
        });
      }

      // Sort by XP
      testUsers.sort((a, b) => b.total_xp - a.total_xp);

      const testLeaderboard = testUsers.map((testUser, index) => ({
        user_id: index === testUsers.length - 1 && user ? user.id : `test-${index}`,
        total_xp: testUser.total_xp,
        rank: index + 1,
        username: testUser.username,
        email: `${testUser.username.toLowerCase().replace(/\s+/g, '')}@example.com`,
      }));

      setLeaderboard(testLeaderboard);
    } catch (error) {
      console.error('Error creating test data:', error);
      setError('Failed to create test data');
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    await fetchLeaderboard();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return styles.goldRank;
      case 2: return styles.silverRank;
      case 3: return styles.bronzeRank;
      default: return styles.defaultRank;
    }
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return user && entry.user_id === user.id;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🏆 Leaderboard</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {leaderboard.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🐕</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyDescription}>
              Start collecting dogs to appear on the leaderboard!
            </Text>
          </View>
        ) : (
          <View style={styles.leaderboardContainer}>
            {leaderboard.map((entry) => (
              <View
                key={entry.user_id}
                style={[
                  styles.leaderboardItem,
                  isCurrentUser(entry) && styles.currentUserItem,
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankText, getRankStyle(entry.rank)]}>
                    {getRankEmoji(entry.rank)}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.username,
                      isCurrentUser(entry) && styles.currentUserText,
                    ]}
                  >
                    {entry.username}
                  </Text>
                  {isCurrentUser(entry) && (
                    <Text style={styles.youBadge}>You</Text>
                  )}
                </View>
                
                <View style={styles.xpContainer}>
                  <Text
                    style={[
                      styles.xpText,
                      isCurrentUser(entry) && styles.currentUserText,
                    ]}
                  >
                    {entry.total_xp} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Collect unique dog breeds to earn XP and climb the leaderboard! 🐾
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  leaderboardContainer: {
    marginTop: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  currentUserItem: {
    backgroundColor: '#FFE6E6',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goldRank: {
    color: '#FFD700',
  },
  silverRank: {
    color: '#C0C0C0',
  },
  bronzeRank: {
    color: '#CD7F32',
  },
  defaultRank: {
    color: '#666',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentUserText: {
    color: '#FF6B6B',
  },
  youBadge: {
    marginLeft: 8,
    backgroundColor: '#FF6B6B',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
