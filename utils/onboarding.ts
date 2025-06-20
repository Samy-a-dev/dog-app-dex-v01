// Utility for storing and retrieving onboarding status
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'HAS_SEEN_ONBOARDING';

export async function setHasSeenOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
}

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error retrieving onboarding status:', error);
    return false;
  }
}
