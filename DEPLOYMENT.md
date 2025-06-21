# Dog Breed Detector - Deployment Guide

## 🚀 Vercel Deployment

This app is configured for deployment to Vercel with the following setup:

### 1. Build Configuration
- **Build Command**: `expo export -p web`
- **Output Directory**: `dist`
- **Framework**: Expo
- **Dev Command**: `expo start --web`

### 2. Environment Variables Required

Set these in your Vercel dashboard:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup (Supabase)

1. Run the migration file `supabase-migration.sql` in your Supabase SQL editor
2. This will create:
   - `leaderboard` table for user scores and rankings
   - `dog_collections` table for tracking detected dogs
   - Proper Row Level Security (RLS) policies
   - Performance indexes

### 4. Deploy Steps

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Or deploy directly**:
   ```bash
   npm run build
   npm run deploy
   ```

3. **Manual deploy**:
   - Push to GitHub
   - Connect repository to Vercel
   - Set environment variables
   - Deploy

### 5. Features Included

✅ **Leaderboard System**
- Real-time rankings from Supabase
- Medal system for top 3 players
- Current user highlighting
- Pull-to-refresh functionality
- Test score generation for development

✅ **Trophy Button**
- Beautiful floating button on home screen
- Navigation to leaderboard
- Gradient styling with shadow effects

✅ **Database Integration**
- Complete Supabase schema
- User authentication support
- Performance optimized queries

✅ **Error-Free Code**
- All TypeScript errors resolved
- Proper React imports
- Navigation system working

### 6. Testing Locally

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for web
npm run build

# Serve built files
npm run serve
```

### 7. Production Checklist

- [ ] Supabase project created and configured
- [ ] Environment variables set in Vercel
- [ ] Database migration executed
- [ ] App successfully builds locally
- [ ] Test leaderboard functionality
- [ ] Verify dog detection works
- [ ] Check all navigation flows

## 🎯 App Features

- **Dog Breed Detection**: Camera integration with AI identification
- **Leaderboard**: Competitive scoring system with real-time rankings
- **Profile Management**: User authentication and profile customization
- **Explore**: Discovery features for dog breeds
- **Dogedex**: Collection system for discovered breeds

Your app is now ready for production deployment! 🐕
