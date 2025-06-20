import { useEffect } from 'react';
import { router } from 'expo-router';

export default function UploadScreen() {
  useEffect(() => {
    // Redirect to breed detector immediately
    router.replace('/breed-detector');
  }, []);

  return null;
}
