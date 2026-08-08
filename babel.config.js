module.exports = function (api) {
  api.cache(true);
  const isProd = process.env.NODE_ENV === 'production';
  return {
    presets: [
      ['babel-preset-expo', { jsxRuntime: 'automatic' }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
      // Remove console.* in production
      isProd && ['transform-remove-console', { exclude: ['error', 'warn'] }],
      // Optimize lodash imports if used
      ['lodash'],
    ].filter(Boolean),
  };
};
