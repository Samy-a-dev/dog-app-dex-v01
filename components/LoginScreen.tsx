import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle, createTextShadowStyle } from '@/utils/shadowStyles';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const { signIn, signUp, signInWithProvider } = useAuth();

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setStatusMessage('Please fill in all fields');
      setStatusType('error');
      return;
    }
    setLoading(true);
    setStatusMessage('');
    setStatusType('');
    try {
      if (isLogin) {
        await signIn(email, password);
        setStatusMessage('Login successful!');
        setStatusType('success');
      } else {
        await signUp(email, password);
        setStatusMessage('Account created! Please check your email to verify your account.');
        setStatusType('success');
      }
    } catch (error: any) {
      let msg = error?.message || 'An error occurred. Please try again.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password.';
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Please check your email and click the verification link before signing in.';
      } else if (msg.toLowerCase().includes('user already registered')) {
        msg = 'An account with this email already exists. Try signing in instead.';
      }
      setStatusMessage(msg);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setStatusMessage('');
    setStatusType('');
    try {
      await signInWithProvider(provider);
      setStatusMessage('Social login successful!');
      setStatusType('success');
    } catch (error: any) {
      setStatusMessage(error?.message || 'Social login failed.');
      setStatusType('error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🐕</Text>
              </View>
            </View>
            <Text style={styles.appTitle}>Bingo</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Status Message */}
            {statusMessage ? (
              <View style={[styles.statusContainer, statusType === 'success' ? styles.statusSuccess : styles.statusError]}>
                <Text style={[styles.statusText, statusType === 'success' ? styles.statusTextSuccess : styles.statusTextError]}>{statusMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Loading...' : isLogin ? 'LOGIN' : 'SIGN UP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
              >
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.switchMode}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchModeText}>
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  logoEmoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    ...createTextShadowStyle({
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    }),
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusSuccess: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  statusError: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusTextSuccess: {
    color: '#4CD964',
  },
  statusTextError: {
    color: '#FF3B30',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchModeText: {
    color: '#666',
    fontSize: 14,
  },
});
