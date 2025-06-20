import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
}

interface DogStats {
  intelligenceRanking: string;
  energyLevel: string;
  sheddingLevel: string;
  droolingTendency: string;
  barkingLevel: string;
}

interface Props {
  onBreedDetected?: (breed: string, funFact?: string, likeness?: number, location?: LocationData) => void;
}

export default function DogBreedCamera({ onBreedDetected }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [breed, setBreed] = useState<string | null>(null);
  const [funFact, setFunFact] = useState<string | null>(null);
  const [likeness, setLikeness] = useState<number | null>(null);
  const [dogStats, setDogStats] = useState<DogStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [location, setLocation] = useState<LocationData | undefined>(undefined);
  const [locationPermission, setLocationPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    // Request location permissions when component mounts
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        console.log('Location permission denied');
      } else {
        console.log('Location permission granted');
      }
    })();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Function to get current location
  const getCurrentLocation = async (): Promise<LocationData | undefined> => {
    if (!locationPermission) {
      console.log('Location permission not granted');
      return undefined;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return undefined;
    }
  };

  const startCamera = async () => {
    if (Platform.OS === 'web') {
      console.log('Attempting to start camera on web...');
      try {
        // Request camera access using browser API
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        console.log('Web camera stream obtained successfully.');
        streamRef.current = stream;
        setIsCameraOpen(true);
        
        // Wait for DOM to update
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log('Web camera stream attached to video element.');
          } else {
            console.log('Video element ref is null, cannot attach stream.');
          }
        }, 100);
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Error accessing camera: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      console.log('Attempting to start camera on native...');
      try {
        // Check if camera permissions are granted on native
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Native camera permission status:', status);
        if (status !== 'granted') {
          alert('Sorry, we need camera permissions to make this work!');
          return;
        }


        console.log('Launching native camera...');
        
        // Get current location before taking the photo
        const currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
        console.log('Current location:', currentLocation);
        
        // Launch camera on native
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
          base64: true,
          exif: true, // Enable EXIF data
        });

        console.log('Native camera result:', result);

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          setPhoto(asset.uri);
          if (asset.base64) {
            await detectBreed(asset.base64, currentLocation);
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

      console.log('Attempting to take picture on web...');
      try {
        // Get current location
        const currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
        console.log('Current location:', currentLocation);
        
        // Capture image from video stream
        if (videoRef.current && canvasRef.current) {
          console.log('Video and canvas refs are available.');
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);
          
          // Draw video frame to canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            console.log('Canvas context obtained.');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            console.log('Video frame drawn to canvas.');
            
            // Convert canvas to base64 image
            const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
            const imageUri = canvas.toDataURL('image/jpeg');
            console.log('Image captured and converted to base64 and URI.');
            
            // Stop camera stream
            if (streamRef.current) {
              console.log('Stopping camera stream.');
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            setIsCameraOpen(false);
            console.log('Camera closed.');
            
            // Process the image
            setPhoto(imageUri);
            console.log('Photo state updated.');
            await detectBreed(base64Image, currentLocation);
            console.log('detectBreed called with base64 image and location.');
          } else {
            console.log('Could not get canvas 2D context.');
          }
        } else {
          console.log('Video or canvas ref is null, cannot capture image.');
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        alert('Error capturing image: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else if (Platform.OS === 'web' && !isCameraOpen) {
      console.log('Camera not open on web, starting camera...');
      // Start camera if not already open
      startCamera();
    } else {
      console.log('takePicture called on non-web platform, handled in startCamera.');
      // For non-web platforms, this is handled in startCamera
    }
  };

  const pickImage = async () => {

    console.log('Attempting to pick image from gallery/device...');
    try {
      // Check if media library permissions are granted
      if (Platform.OS !== 'web') {
        console.log('Checking media library permissions on native...');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Native media library permission status:', status);
        if (status !== 'granted') {
          alert('Sorry, we need media library permissions to make this work!');
          return;
        }
      } else {
        console.log('Media library permissions not required on web.');
      }

      // Get current location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      console.log('Current location:', currentLocation);

      // Launch image library
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
        exif: true, // Enable EXIF data to get location if available in the image
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        if (asset.base64) {
          await detectBreed(asset.base64, currentLocation);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error accessing gallery: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const detectBreed = async (base64Image: string, locationData?: LocationData) => {

    console.log('Starting breed detection...');
    setIsProcessing(true);
    setFunFact(null);
    setLikeness(null);
    
    try {
      console.log('Initializing Gemini API...');
      // Initialize Gemini API with your API key
      const genAI = new GoogleGenerativeAI('AIzaSyCCTHQTM21vpAcngjwoQuUXrJYaesVZzmQ');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('Gemini model initialized.');

      const prompt = `Analyze this image and respond in JSON format with the following structure:
{
  "type": "dog" or "human" or "other",
  "identification": breed name if dog, or description if other,
  "likeness": confidence score from 0-100,
  "funFact": an interesting fact about the breed or subject
}

For example, if it's a Golden Retriever dog:
{
  "type": "dog",
  "identification": "Golden Retriever",
  "likeness": 95,
  "funFact": "Golden Retrievers were originally bred in Scotland in the mid-19th century as hunting dogs to retrieve waterfowl."
}

If it's a human:
{
  "type": "human",
  "identification": "person",
  "likeness": 98,
  "funFact": "Humans are the only species known to blush."
}

If it's something else:
{
  "type": "other",
  "identification": "cat",
  "likeness": 90,
  "funFact": "Cats spend about 70% of their lives sleeping."
}`;
      

      console.log('Sending image to Gemini API...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        }
      ]);
      console.log('Gemini API response received.');

      const response = await result.response;

      let detectionResultText = response.text().trim();
      console.log('Gemini API raw response text:', detectionResultText);

      // Remove markdown code block if present
      if (detectionResultText.startsWith('```json')) {
        detectionResultText = detectionResultText.substring('```json'.length);
      }
      if (detectionResultText.endsWith('```')) {
        detectionResultText = detectionResultText.substring(0, detectionResultText.length - '```'.length);
      }
      detectionResultText = detectionResultText.trim(); // Trim again after removing delimiters

      console.log('Gemini API cleaned response text:', detectionResultText);

      // Parse the JSON response
      try {
        console.log('Attempting to parse JSON response...');
        const detectionResult = JSON.parse(detectionResultText);
        console.log('JSON response parsed successfully:', detectionResult);
        let detectedBreed: string;
        let detectedFunFact: string = detectionResult.funFact || '';
        let detectedLikeness: number = detectionResult.likeness || 0;
        
        if (detectionResult.type === 'dog') {
          detectedBreed = detectionResult.identification;
        } else if (detectionResult.type === 'human') {
          detectedBreed = 'Human detected - not a dog';
        } else {
          detectedBreed = `Not a dog: ${detectionResult.identification}`;
        }
        
        setBreed(detectedBreed);
        setFunFact(detectedFunFact);
        setLikeness(detectedLikeness);
        // Add default stats
        setDogStats({
          intelligenceRanking: "#4 out of 138 (very trainable)",
          energyLevel: "High",
          sheddingLevel: "Moderate to High",
          droolingTendency: "Low",
          barkingLevel: "Moderate"
        });
        console.log(`Detected: Type=${detectionResult.type}, ID=${detectedBreed}, Likeness=${detectedLikeness}, FunFact=${detectedFunFact}`);
        
        if (onBreedDetected) {
          console.log('Calling onBreedDetected callback with location:', locationData);
          onBreedDetected(detectedBreed, detectedFunFact, detectedLikeness, locationData);
        }
      } catch (jsonError) {
        // Fallback if JSON parsing fails
        console.error('Error parsing JSON response:', jsonError);
        
        // Try to extract information from text response
        let detectedBreed: string;
        
        if (detectionResultText.toLowerCase().includes('dog')) {
          detectedBreed = 'Dog (unable to identify specific breed)';
        } else if (detectionResultText.toLowerCase().includes('human')) {
          detectedBreed = 'Human detected - not a dog';
        } else {
          detectedBreed = 'Unable to identify subject';
        }
        
        setBreed(detectedBreed);
        console.log('JSON parsing failed, falling back to text analysis. Detected breed:', detectedBreed);
        if (onBreedDetected) {
          console.log('Calling onBreedDetected callback (fallback) with location:', locationData);
          onBreedDetected(detectedBreed, undefined, undefined, locationData);
        }
      }
    } catch (error) {
      console.error('Error detecting breed:', error);
      setBreed('Error detecting breed');
    } finally {
      console.log('Breed detection process finished.');
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} resizeMode="contain" />
          {isProcessing ? (
            <Text style={styles.breedText}>Detecting breed...</Text>
          ) : breed ? (
            <>
              <Text style={styles.breedText}>{breed}</Text>
              {likeness !== null && (
                <Text style={styles.likenessText}>Confidence: {likeness}%</Text>
              )}
              {funFact && (
                <View style={styles.funFactContainer}>
                  <Text style={styles.funFactTitle}>Fun Fact:</Text>
                  <Text style={styles.funFactText}>{funFact}</Text>
                </View>
              )}
              {dogStats && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsTitle}>Dog Stats:</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Intelligence:</Text>
                      <Text style={styles.statValue}>{dogStats.intelligenceRanking}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Energy:</Text>
                      <Text style={styles.statValue}>{dogStats.energyLevel}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Shedding:</Text>
                      <Text style={styles.statValue}>{dogStats.sheddingLevel}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Drooling:</Text>
                      <Text style={styles.statValue}>{dogStats.droolingTendency}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Barking:</Text>
                      <Text style={styles.statValue}>{dogStats.barkingLevel}</Text>
                    </View>
                  </View>
                </View>
              )}
              {location && (
                <View style={styles.locationContainer}>
                  <Text style={styles.locationTitle}>Photo Location:</Text>
                  <Text style={styles.locationText}>
                    Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
                  </Text>
                  {location.altitude && (
                    <Text style={styles.locationText}>Altitude: {location.altitude.toFixed(2)}m</Text>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.button} onPress={() => {
                setPhoto(null);
                setBreed(null);
                setFunFact(null);
                setLikeness(null);
                setDogStats(null);
                setLocation(undefined);
              }}>
                <Text style={styles.buttonText}>Take Another Photo</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: '100%',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  likenessText: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  funFactContainer: {
    backgroundColor: 'rgba(123, 75, 148, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  funFactTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  funFactText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: 'rgba(123, 75, 148, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
  },
  locationContainer: {
    backgroundColor: 'rgba(0, 128, 255, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  locationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
