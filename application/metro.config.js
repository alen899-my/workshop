const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Resolve react-async-hook for react-native-country-picker-modal (transitive dep)
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-async-hook': require.resolve('react-async-hook'),
};

module.exports = withNativeWind(config, { input: './global.css' });
