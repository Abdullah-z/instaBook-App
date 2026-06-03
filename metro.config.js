// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Watch the local modules directory so changes to nearby-chat are picked up
const modulesDir = path.resolve(__dirname, 'modules');
config.watchFolders = [...(config.watchFolders || []), modulesDir];

// Allow Metro to resolve TypeScript files from local modules
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, 'modules'),
  ],
};

module.exports = config;

