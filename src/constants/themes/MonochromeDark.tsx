import { MD3DarkTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const MonochromeDark = {
  ...MD3DarkTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(226, 226, 230)', // Light Silver #E2E2E6
    onPrimary: 'rgb(26, 28, 30)', // #1A1C1E
    primaryContainer: 'rgb(66, 66, 66)',
    onPrimaryContainer: 'rgb(226, 226, 230)',
    secondary: 'rgb(189, 189, 189)',
    onSecondary: 'rgb(33, 33, 33)',
    secondaryContainer: 'rgb(66, 66, 66)',
    onSecondaryContainer: 'rgb(238, 238, 238)',
    tertiary: 'rgb(210, 210, 210)',
    onTertiary: 'rgb(0, 0, 0)',
    tertiaryContainer: 'rgb(33, 33, 33)',
    onTertiaryContainer: 'rgb(250, 250, 250)',
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 180, 171)',
    background: 'rgb(26, 28, 30)', // #1A1C1E
    onBackground: 'rgb(255, 255, 255)',
    surface: 'rgb(43, 43, 43)', // #2B2B2B
    onSurface: 'rgb(255, 255, 255)',
    surfaceVariant: 'rgb(66, 66, 66)',
    onSurfaceVariant: 'rgb(189, 189, 189)',
    outline: 'rgb(142, 144, 153)',
    outlineVariant: 'rgb(66, 66, 66)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(255, 255, 255)',
    inverseOnSurface: 'rgb(26, 28, 30)',
    inversePrimary: 'rgb(26, 28, 30)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(33, 33, 36)',
      level2: 'rgb(38, 38, 41)',
      level3: 'rgb(43, 43, 46)',
      level4: 'rgb(45, 45, 48)',
      level5: 'rgb(49, 49, 52)',
    },
    surfaceDisabled: 'rgba(255, 255, 255, 0.12)',
    onSurfaceDisabled: 'rgba(255, 255, 255, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};
