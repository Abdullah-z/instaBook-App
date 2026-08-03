import { MD3DarkTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const GenZDark = {
  ...MD3DarkTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF007F', // Electric Hot Pink / Magenta
    onPrimary: '#FFFFFF',
    primaryContainer: '#660033',
    onPrimaryContainer: '#FFB3D9',
    secondary: '#8A2BE2', // Blue Violet
    onSecondary: '#FFFFFF',
    secondaryContainer: '#3B0066',
    onSecondaryContainer: '#E6B8FF',
    tertiary: '#CCFF00', // Gen-Z Lime
    onTertiary: '#000000',
    tertiaryContainer: '#445500',
    onTertiaryContainer: '#F0FFB3',
    error: '#FF3366',
    onError: '#FFFFFF',
    errorContainer: '#660019',
    onErrorContainer: '#FFB3C4',
    background: '#0F0C1B', // Deep Space Purple
    onBackground: '#F4F0FF',
    surface: '#1A162B', // Sleek violet surface
    onSurface: '#F4F0FF',
    surfaceVariant: '#2A2440',
    onSurfaceVariant: '#C5BDDB',
    outline: '#584C7A',
    outlineVariant: '#352D4D',
    shadow: '#000000',
    scrim: '#000000',
    elevation: {
      level0: 'transparent',
      level1: '#161226',
      level2: '#1F1A33',
      level3: '#26203E',
      level4: '#2E274A',
      level5: '#352D56',
    },
    surfaceDisabled: 'rgba(244, 240, 255, 0.12)',
    onSurfaceDisabled: 'rgba(244, 240, 255, 0.38)',
    backdrop: 'rgba(15, 12, 27, 0.85)',
  },
};
