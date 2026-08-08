const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable WebP for better image compression
config.resolver.assetExts.push('webp', 'avif');

// Optimize resolver for faster bundling
config.resolver.unstable_enablePackageExports = true;

// Tree-shaking optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: true,
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.warn', 'console.info'],
    },
  },
};

module.exports = config;
