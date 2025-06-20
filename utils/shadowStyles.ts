import { Platform } from 'react-native';

export const createShadowStyle = (shadowConfig: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  if (Platform.OS === 'web') {
    const {
      shadowColor = '#000',
      shadowOffset = { width: 0, height: 2 },
      shadowOpacity = 0.1,
      shadowRadius = 4,
    } = shadowConfig;

    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }

  return shadowConfig;
};

export const createTextShadowStyle = (textShadowConfig: {
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
}) => {
  if (Platform.OS === 'web') {
    const {
      textShadowColor = 'rgba(0, 0, 0, 0.3)',
      textShadowOffset = { width: 0, height: 2 },
      textShadowRadius = 4,
    } = textShadowConfig;

    return {
      textShadow: `${textShadowOffset.width}px ${textShadowOffset.height}px ${textShadowRadius}px ${textShadowColor}`,
    };
  }

  return textShadowConfig;
};
