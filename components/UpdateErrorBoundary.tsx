import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class UpdateErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is the specific update download error
    if (error.message.includes('Failed to download remote update') || 
        error.message.includes('java.io.IOException')) {
      return { hasError: true, error };
    }
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Update Error Boundary caught an error:', error, errorInfo);
    
    // Log the specific error for debugging
    if (error.message.includes('Failed to download remote update')) {
      console.log('Update download failed - this is expected in development mode');
    }
  }

  handleReload = async () => {
    try {
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
      } else {
        // In development, just reset the error state
        this.setState({ hasError: false, error: null });
      }
    } catch (error) {
      console.log('Failed to reload app:', error);
      // Reset error state anyway
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorMessage}>
              Unable to download app updates. This usually happens in development mode.
            </Text>
            <TouchableOpacity style={styles.reloadButton} onPress={this.handleReload}>
              <Text style={styles.reloadButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
