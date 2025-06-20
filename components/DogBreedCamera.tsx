import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Props {
  onBreedDetected?: (breed: string) => void;
}

export default function DogBreedCamera({ onBreedDetected }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [breed, setBreed] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (Platform.OS === 'web') {
      try {
        // Request camera access using browser API
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        streamRef.current = stream;
        setIsCameraOpen(true);
        
        // Wait for DOM to update
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Error accessing camera: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      try {
        // Check if camera permissions are granted on native
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera permissions to make this work!');
          return;
        }

        // Launch camera on native
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
          base64: true,
          exif: false,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          setPhoto(asset.uri);
          if (asset.base64) {
            await detectBreed(asset.base64);
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        alert('Error accessing camera: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };
  
  const takePicture = async () => {
    if (Platform.OS === 'web' && isCameraOpen) {
      try {
        // Capture image from video stream
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to base64 image
            const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
            const imageUri = canvas.toDataURL('image/jpeg');
            
            // Stop camera stream
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            setIsCameraOpen(false);
            
            // Process the image
            setPhoto(imageUri);
            await detectBreed(base64Image);
          }
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        alert('Error capturing image: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else if (Platform.OS === 'web' && !isCameraOpen) {
      // Start camera if not already open
      startCamera();
    } else {
      // For non-web platforms, this is handled in startCamera
    }
  };

  const pickImage = async () => {
    try {
      // Check if media library permissions are granted
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need media library permissions to make this work!');
          return;
        }
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
        exif: false,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        if (asset.base64) {
          await detectBreed(asset.base64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error accessing gallery: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const detectBreed = async (base64Image: string) => {
    setIsProcessing(true);
    try {
      // Initialize Gemini API (you'll need to replace 'YOUR_API_KEY' with actual key)
      const genAI = new GoogleGenerativeAI('AIzaSyCCTHQTM21vpAcngjwoQuUXrJYaesVZzmQ');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = 'What breed of dog is in this image? Please provide only the breed name, nothing else.';
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        }
      ]);

      const response = await result.response;
      const detectedBreed = response.text().trim();
      
      setBreed(detectedBreed);
      if (onBreedDetected) {
        onBreedDetected(detectedBreed);
      }
    } catch (error) {
      console.error('Error detecting breed:', error);
      setBreed('Error detecting breed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <Text style={styles.breedText}>
            {isProcessing ? 'Detecting breed...' : breed || 'No breed detected'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setPhoto(null);
              setBreed(null);
            }}
          >
            <Text style={styles.buttonText}>Take Another Photo</Text>
          </TouchableOpacity>
        </View>
      ) : Platform.OS === 'web' && isCameraOpen ? (
        <View style={styles.cameraContainer}>
          <Text style={styles.headerText}>Dog Breed Detector</Text>
          <View style={styles.webCameraContainer}>
            {/* @ts-ignore - React Native Web will render this as a video element */}
            <video
              ref={videoRef as any}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
                borderRadius: 10,
              }}
            />
            {/* @ts-ignore - React Native Web will render this as a canvas element */}
            <canvas
              ref={canvasRef as any}
              style={{ display: 'none' }}
            />
          </View>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Text style={styles.headerText}>Dog Breed Detector</Text>
          <Text style={styles.instructionText}>Take a photo of a dog to identify its breed</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.buttonText}>{Platform.OS === 'web' ? 'Open Camera' : 'Take Photo'}</Text>
            </TouchableOpacity>
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            )}
            
            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>Upload from Device</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webCameraContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#7B4B94',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  preview: {
    width: '100%',
    height: '60%',
    borderRadius: 10,
    marginBottom: 20,
  },
  breedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
});
