import { MD3DarkTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const OledDark = {
  ...MD3DarkTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00E5FF', // Electric Cyan
    onPrimary: '#000000',
    primaryContainer: '#00363D',
    onPrimaryContainer: '#80F4FF',
    secondary: '#3D5AFE',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#1C2B80',
    onSecondaryContainer: '#C0C7FF',
    tertiary: '#FF0055',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#660022',
    onTertiaryContainer: '#FFB3C6',
    error: '#FF5252',
    onError: '#000000',
    errorContainer: '#600000',
    onErrorContainer: '#FFD6D6',
    background: '#000000', // Pure pitch black OLED
    onBackground: '#FFFFFF',
    surface: '#0A0A0C', // Ultra dark surface
    onSurface: '#FFFFFF',
    surfaceVariant: '#141418',
    onSurfaceVariant: '#B3B3B3',
    outline: '#33333D',
    outlineVariant: '#1F1F24',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#000000',
    inversePrimary: '#006875',
    elevation: {
      level0: 'transparent',
      level1: '#09090B',
      level2: '#101014',
      level3: '#16161A',
      level4: '#1C1C20',
      level5: '#222226',
    },
    surfaceDisabled: 'rgba(255, 255, 255, 0.12)',
    onSurfaceDisabled: 'rgba(255, 255, 255, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.85)',
  },
};
