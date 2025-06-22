/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// New Palette inspired by UI/UX Sweep Screenshot

// Light Theme Colors
const lightText = '#2D3748'; // Charcoal Gray
const lightBackground = '#F7FAFC'; // Very Light Gray (almost white)
const lightPrimary = '#68D391'; // Vibrant Soft Green
const lightSecondary = '#7F9CF5'; // Friendly Blue
const lightAccent = '#F6AD55'; // Warm Orange/Peach
const lightCard = '#FFFFFF'; // White
const lightCardStroke = '#E2E8F0'; // Light Gray
const lightIcon = '#4A5568'; // Medium Gray
const lightTabIconDefault = '#A0AEC0'; // Light Medium Gray

// Dark Theme Colors
const darkText = '#E2E8F0'; // Light Gray
const darkBackground = '#1A202C'; // Very Dark Blue/Gray
const darkPrimary = '#48BB78'; // Slightly Muted Green
const darkSecondary = '#667EEA'; // Slightly Muted Blue
const darkAccent = '#ED8936'; // Slightly Muted Orange
const darkCard = '#2D3748'; // Charcoal Gray
const darkCardStroke = '#4A5568'; // Medium Gray
const darkIcon = '#CBD5E0'; // Lighter Gray
const darkTabIconDefault = '#718096'; // Medium Dark Gray

export const Colors = {
  light: {
    text: lightText,
    background: lightBackground,
    primary: lightPrimary,
    secondary: lightSecondary,
    accent: lightAccent,
    card: lightCard,
    cardStroke: lightCardStroke,
    tint: lightPrimary,
    icon: lightIcon,
    tabIconDefault: lightTabIconDefault,
    tabIconSelected: lightPrimary,
  },
  dark: {
    text: darkText,
    background: darkBackground,
    primary: darkPrimary,
    secondary: darkSecondary,
    accent: darkAccent,
    card: darkCard,
    cardStroke: darkCardStroke,
    tint: darkPrimary,
    icon: darkIcon,
    tabIconDefault: darkTabIconDefault,
    tabIconSelected: darkPrimary,
  },
};
