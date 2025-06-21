import { useEffect } from 'react';
import { router } from 'expo-router';

export default function CameraScreen() {
  useEffect(() => {
    // Redirect to breed detector immediately
    router.replace('/breed-detector');
  }, []);

  return null;
}
