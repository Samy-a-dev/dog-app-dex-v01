# Bingo Dog Collector App 🐕

A React Native app built with Expo that allows users to collect and discover different dog breeds. Features authentication with Supabase and a beautiful UI inspired by modern mobile design patterns.

## Features

- **Splash Screen**: Beautiful animated splash screen with gradient background
- **Authentication**: 
  - Email/password sign up and login
  - Social login with Google and Apple (configured via Supabase)
  - Persistent user sessions
- **Modern UI**: Gradient backgrounds, cards, and smooth animations
- **Dog Collection**: Interface ready for collecting different dog breeds
- **Profile Management**: User profile with stats and sign-out functionality
- **Dog User Matching System**: Users can match together tinder style

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Configure Authentication Providers (Optional)

To enable Google and Apple sign-in:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Configure your OAuth providers:
   - **Google**: Add your Google OAuth client ID
   - **Apple**: Configure Apple sign-in

### 4. Start the Development Server

```bash
npx expo start
```

In the output, you'll find options to open the app in:
- [Expo Go](https://expo.dev/go) on your mobile device
- iOS Simulator 
- Android Emulator
- Web browser

## Project Structure

```
app/
├── _layout.tsx          # Root layout with AuthProvider
├── index.tsx            # Initial routing screen
├── auth.tsx             # Authentication screen
└── (tabs)/              # Main app tabs
    ├── _layout.tsx      # Tab navigation
    ├── index.tsx        # Home/Dogs screen
    ├── explore.tsx      # Explore screen
    └── profile.tsx      # Profile screen

components/
├── SplashScreen.tsx     # Animated splash screen
└── LoginScreen.tsx      # Login/signup form

contexts/
└── AuthContext.tsx      # Authentication context

lib/
└── supabase.ts          # Supabase configuration
```

## Design Features

- **Gradient Backgrounds**: Beautiful orange-to-red gradients inspired by the "Bingo" brand
- **Card-based Layout**: Modern card design with shadows and rounded corners
- **Responsive Design**: Optimized for different screen sizes
- **Smooth Animations**: Fade and scale animations for better UX

## Authentication Flow

1. **Splash Screen**: Shows for 2.5 seconds with app branding
2. **Authentication Check**: Checks for existing user session
3. **Login Screen**: Email/password and social login options
4. **Main App**: Tab-based navigation with dog collection features
5. **Profile Management**: User stats and sign-out functionality

## Next Steps

This app provides a solid foundation for a dog collecting game. You can extend it by:

- Adding a dog API integration
- Implementing breed discovery mechanics
- Adding collection achievements
- Creating a real dog database
- Adding image recognition features
- Implementing geolocation for dog discoveries

## Technologies Used

- **React Native** with **Expo**
- **Supabase** for authentication and backend
- **Expo Router** for navigation
- **Linear Gradients** for beautiful UI
- **TypeScript** for type safety

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
