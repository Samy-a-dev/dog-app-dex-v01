/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    // Add other paths if necessary, e.g., specific screens or utility files
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors from constants/Colors.ts
        light: {
          text: '#2D3748',        // Charcoal Gray
          background: '#F7FAFC',  // Very Light Gray
          primary: '#68D391',     // Vibrant Soft Green
          secondary: '#7F9CF5',   // Friendly Blue
          accent: '#F6AD55',      // Warm Orange/Peach
          card: '#FFFFFF',        // White
          cardStroke: '#E2E8F0', // Light Gray
          icon: '#4A5568',        // Medium Gray
          tabIconDefault: '#A0AEC0', // Light Medium Gray
          tabIconSelected: '#68D391', // Vibrant Soft Green (same as primary)
        },
        // Dark Theme Colors from constants/Colors.ts
        dark: {
          text: '#E2E8F0',        // Light Gray
          background: '#1A202C',  // Very Dark Blue/Gray
          primary: '#48BB78',     // Slightly Muted Green
          secondary: '#667EEA',   // Slightly Muted Blue
          accent: '#ED8936',      // Slightly Muted Orange
          card: '#2D3748',        // Charcoal Gray
          cardStroke: '#4A5568', // Medium Gray
          icon: '#CBD5E0',        // Lighter Gray
          tabIconDefault: '#718096', // Medium Dark Gray
          tabIconSelected: '#48BB78', // Slightly Muted Green (same as primary)
        }
      }
    },
  },
  plugins: [],
};

