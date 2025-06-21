const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add resolver for React Native web
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Fix for Android update download issues
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Add CORS headers for Android
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
