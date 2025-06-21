import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export class UpdateManager {
  private static hasInitialized = false;

  /**
   * Initialize update handling - disable automatic updates for development
   */
  static async initialize() {
    if (this.hasInitialized) return;
    
    try {
      // Only handle updates in production/built apps
      if (!__DEV__ && Updates.isEnabled) {
        console.log('Updates enabled, checking for updates...');
        
        // Check for updates but don't force them
        const { isAvailable } = await Updates.checkForUpdateAsync();
        
        if (isAvailable) {
          console.log('Update available, downloading...');
          await Updates.fetchUpdateAsync();
          // Don't automatically reload, let user decide
          console.log('Update downloaded, ready for next app start');
        }
      } else {
        console.log('Updates disabled or in development mode');
      }
    } catch (error) {
      console.log('Update check failed:', error);
      // Don't throw error, just log it
      this.handleUpdateError(error);
    }
    
    this.hasInitialized = true;
  }

  /**
   * Handle update errors gracefully
   */
  private static handleUpdateError(error: any) {
    const errorMessage = error?.message || 'Unknown update error';
    
    // Common update errors that we can safely ignore
    const ignorableErrors = [
      'Failed to download remote update',
      'java.io.IOException',
      'Network request failed',
      'Unable to resolve host',
      'Connection timeout'
    ];
    
    const shouldIgnore = ignorableErrors.some(ignorePattern => 
      errorMessage.includes(ignorePattern)
    );
    
    if (shouldIgnore) {
      console.log('Ignoring non-critical update error:', errorMessage);
    } else {
      console.warn('Unexpected update error:', error);
    }
  }

  /**
   * Manually reload the app (useful for error recovery)
   */
  static async reloadApp() {
    try {
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
      } else {
        // In development, we can't actually reload
        console.log('Reload requested but not available in development mode');
      }
    } catch (error) {
      console.log('Failed to reload app:', error);
    }
  }

  /**
   * Check if we're running in a development environment
   */
  static isDevelopment(): boolean {
    return __DEV__ || !Updates.isEnabled;
  }

  /**
   * Get current app info
   */
  static getAppInfo() {
    return {
      isEnabled: Updates.isEnabled,
      isDevelopment: this.isDevelopment(),
      platform: Platform.OS,
      updateId: Updates.updateId,
      runtimeVersion: Updates.runtimeVersion,
    };
  }
}

// Auto-initialize when imported (but don't await it)
UpdateManager.initialize().catch(error => {
  console.log('Failed to initialize UpdateManager:', error);
});
