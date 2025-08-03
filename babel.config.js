module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-paper/babel',
      'react-native-reanimated/plugin', // 👈 MUST be last and outside env
    ],
  };
};
