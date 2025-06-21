import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const debugOAuth = {
  async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Supabase connection successful');
      return { success: true, session: data.session };
    } catch (e) {
      console.error('❌ Supabase connection exception:', e);
      return { success: false, error: e.message };
    }
  },

  logEnvironment() {
    console.log('🔧 Environment Debug Info:');
    console.log('Platform:', Platform.OS);
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('Has Anon Key:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  },

  async troubleshootOAuth(provider: string, error: any) {
    console.log(`🚨 OAuth Troubleshooting for ${provider}:`);
    console.log('Error:', error);
    
    const suggestions = [];
    
    if (error.message?.includes('Failed to download remote update')) {
      suggestions.push('• Network connectivity issue - check internet connection');
      suggestions.push('• Try restarting the app');
      suggestions.push('• Use email/password authentication as fallback');
    }
    
    if (error.message?.includes('java.io.IOException')) {
      suggestions.push('• Android network security issue');
      suggestions.push('• Check network_security_config.xml configuration');
      suggestions.push('• Verify OAuth provider configuration in Supabase');
    }
    
    if (error.message?.includes('OAuth')) {
      suggestions.push('• Check OAuth configuration in Supabase dashboard');
      suggestions.push('• Verify redirect URLs are properly configured');
      suggestions.push('• Ensure OAuth provider credentials are valid');
    }
    
    console.log('💡 Suggested fixes:');
    suggestions.forEach(suggestion => console.log(suggestion));
    
    return suggestions;
  }
};

// Auto-log environment on import in development
if (__DEV__) {
  debugOAuth.logEnvironment();
}
