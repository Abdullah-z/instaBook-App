import { MD3DarkTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const SpectrumDark = {
  ...MD3DarkTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF0077', // Vivid Electric Magenta/Pink
    onPrimary: '#FFFFFF',
    primaryContainer: '#660030',
    onPrimaryContainer: '#FFB8DB',
    secondary: '#00E5FF', // Vibrant Cyan
    onSecondary: '#000000',
    secondaryContainer: '#004D57',
    onSecondaryContainer: '#B8F8FF',
    tertiary: '#FFD600', // Neon Sunburst Yellow
    onTertiary: '#000000',
    tertiaryContainer: '#574900',
    onTertiaryContainer: '#FFF3B8',
    error: '#FF3333',
    onError: '#FFFFFF',
    errorContainer: '#660000',
    onErrorContainer: '#FFB8B8',
    background: '#0D061A', // Deep Kaleidoscope Indigo
    onBackground: '#F8F5FF',
    surface: '#1A0C33', // Multi-tone deep purple surface
    onSurface: '#F8F5FF',
    surfaceVariant: '#2D1654',
    onSurfaceVariant: '#D7C7F5',
    outline: '#7E52C6',
    outlineVariant: '#46237A',
    shadow: '#000000',
    scrim: '#000000',
    elevation: {
      level0: 'transparent',
      level1: '#16092E',
      level2: '#200D42',
      level3: '#291157',
      level4: '#32156B',
      level5: '#3B1880',
    },
    surfaceDisabled: 'rgba(248, 245, 255, 0.12)',
    onSurfaceDisabled: 'rgba(248, 245, 255, 0.38)',
    backdrop: 'rgba(13, 6, 26, 0.85)',
  },
};
