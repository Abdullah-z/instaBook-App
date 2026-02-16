import { MD3LightTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const NothingLight = {
  ...MD3LightTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(215, 26, 33)', // #D71A21
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(215, 26, 33)', // #D71A21
    onPrimaryContainer: 'rgb(255, 255, 255)',
    secondary: 'rgb(215, 26, 33)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(226, 226, 226)', // #E2E2E2
    onSecondaryContainer: 'rgb(0, 0, 0)',
    tertiary: 'rgb(0, 0, 0)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(246, 246, 246)', // #F6F6F6
    onTertiaryContainer: 'rgb(0, 0, 0)',
    error: 'rgb(215, 26, 33)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 255, 255)',
    onErrorContainer: 'rgb(215, 26, 33)',
    background: 'rgb(254, 254, 254)', // #FEFEFE
    onBackground: 'rgb(0, 0, 0)',
    surface: 'rgb(246, 246, 246)', // #F6F6F6
    onSurface: 'rgb(0, 0, 0)',
    surfaceVariant: 'rgb(246, 246, 246)', // #F6F6F6
    onSurfaceVariant: 'rgb(0, 0, 0)',
    outline: 'rgb(0, 0, 0)',
    outlineVariant: 'rgb(226, 226, 226)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(0, 0, 0)',
    inverseOnSurface: 'rgb(255, 255, 255)',
    inversePrimary: 'rgb(215, 26, 33)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(246, 246, 246)',
      level2: 'rgb(246, 246, 246)',
      level3: 'rgb(246, 246, 246)',
      level4: 'rgb(246, 246, 246)',
      level5: 'rgb(246, 246, 246)',
    },
    surfaceDisabled: 'rgba(0, 0, 0, 0.12)',
    onSurfaceDisabled: 'rgba(0, 0, 0, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
};
