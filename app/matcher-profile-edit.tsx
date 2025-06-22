import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Function to upload matcher dog image
async function uploadMatcherDogImage(userId: string, imageUri: string): Promise<string | null> {
  if (!imageUri || !userId) {
    console.error('User ID or Image URI is missing for upload.');
    return null;
  }

  try {
    let blob: Blob;
    let fileExtension: string;
    let mimeType: string;

    if (imageUri.startsWith('data:')) {
      // Handle base64 data URI (common from web image pickers after editing/cropping)
      const byteString = Buffer.from(imageUri.split(',')[1], 'base64').toString('binary');
      const ia = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const match = imageUri.match(/^data:(.*?);base64,/);
      mimeType = match ? match[1] : 'image/jpeg';
      blob = new Blob([ia], { type: mimeType });
      fileExtension = mimeType.split('/')[1] || 'jpg';
    } else {
      // Handle file URI (common on native or direct file links)
      const uriToFetch = Platform.OS === 'android' && !imageUri.startsWith('file://')
        ? `file://${imageUri}`
        : imageUri;
      const response = await fetch(uriToFetch);
      blob = await response.blob();
      mimeType = blob.type || 'image/jpeg'; 
      const extensionMatch = imageUri.split('.').pop()?.toLowerCase();
      fileExtension = extensionMatch || (mimeType.startsWith('image/') ? mimeType.split('/')[1] : 'jpg');
      if (!mimeType.startsWith('image/') && fileExtension) {
        mimeType = `image/${fileExtension}`;
      }
    }
    
    if (!blob) {
        throw new Error("Could not create blob from image URI");
    }

    const fileName = `${userId}/${Date.now()}.${fileExtension}`;
    console.log(`Uploading to Supabase: fileName='${fileName}', mimeType='${mimeType}', blob size=${blob.size}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('matcher-dog-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (uploadError) {
      console.error('Error uploading matcher dog image:', uploadError);
      Alert.alert('Upload Error', `Failed to upload image: ${uploadError.message}`);
      return null;
    }

    console.log('Image uploaded successfully:', uploadData?.path);

    const { data: publicUrlData } = supabase.storage
      .from('matcher-dog-images')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Error getting public URL for matcher dog image:', fileName);
      Alert.alert('Error', 'Could not get image URL after upload.');
      return null;
    }
    console.log('Public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Exception during image upload or URL retrieval:', error);
    Alert.alert('Upload Exception', `An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export default function MatcherProfileEditScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string>(''); // ADDED
  const [dogImageUrl, setDogImageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth'); 
      return;
    }

    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }
      }
    };
    requestPermissions();

    const fetchMatcherProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username, matcher_dog_image_url, matcher_bio') // ADDED username
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { 
          throw error;
        }
        if (data) {
          setUsername(data.username || ''); // ADDED
          setDogImageUrl(data.matcher_dog_image_url);
          setSelectedImageUri(data.matcher_dog_image_url); 
          setBio(data.matcher_bio || '');
        }
      } catch (error) {
        console.error('Error fetching matcher profile:', error);
        Alert.alert('Error', 'Could not fetch your matcher profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatcherProfile();
  }, [user, router]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], 
        allowsEditing: true,
        aspect: [1, 1], 
        quality: 0.7, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      Alert.alert("Image Pick Error", "Could not select image.");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) { // FUCKING VALIDATE USERNAME
      Alert.alert('Username Required', 'Please enter a username.');
      return;
    }
    setSaving(true);

    let finalDogImageUrl = dogImageUrl;

    if (selectedImageUri && selectedImageUri !== dogImageUrl) {
      const uploadedUrl = await uploadMatcherDogImage(user.id, selectedImageUri);
      if (uploadedUrl) {
        finalDogImageUrl = uploadedUrl;
      } else {
        Alert.alert('Upload Failed', 'Could not upload the new dog image.');
        setSaving(false);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(), // ADDED username
          matcher_dog_image_url: finalDogImageUrl,
          matcher_bio: bio,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Matcher profile updated!');
      setDogImageUrl(finalDogImageUrl); 
      router.back(); 
    } catch (error) {
      console.error('Error saving matcher profile:', error);
      Alert.alert('Error', 'Could not save your matcher profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Go Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Edit Matcher Profile</Text>

      <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.dogImage} />
        ) : (
          <Text style={styles.imagePickerText}>Tap to select Dog&apos;s Image</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Your Username:</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        style={styles.textInputUsername}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Your Bio for Dog Matching:</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Tell other dog walkers a bit about you and your dog..."
        multiline
        numberOfLines={4}
        style={styles.textInput}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10, 
    left: 10,
    zIndex: 1,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B', 
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  dogImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imagePickerText: {
    color: '#757575',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  textInputUsername: { 
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});