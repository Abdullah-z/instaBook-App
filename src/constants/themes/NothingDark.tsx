import { MD3DarkTheme } from 'react-native-paper';
import { fontConfig } from './fontConfig';

export const NothingDark = {
  ...MD3DarkTheme,
  roundness: 24,
  ...fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(215, 26, 33)', // #D71A21
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(215, 26, 33)', // #D71A21
    onPrimaryContainer: 'rgb(255, 255, 255)',
    secondary: 'rgb(255, 255, 255)',
    onSecondary: 'rgb(0, 0, 0)',
    secondaryContainer: 'rgb(71, 70, 75)', // #47464B
    onSecondaryContainer: 'rgb(255, 255, 255)',
    tertiary: 'rgb(255, 255, 255)',
    onTertiary: 'rgb(0, 0, 0)',
    tertiaryContainer: 'rgb(71, 70, 75)', // #47464B
    onTertiaryContainer: 'rgb(255, 255, 255)',
    error: 'rgb(215, 26, 33)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(215, 26, 33)',
    onErrorContainer: 'rgb(255, 255, 255)',
    background: 'rgb(13, 13, 15)', // #0D0D0F
    onBackground: 'rgb(255, 255, 255)',
    surface: 'rgb(38, 38, 40)', // #262628
    onSurface: 'rgb(255, 255, 255)',
    surfaceVariant: 'rgb(71, 70, 75)', // #47464B
    onSurfaceVariant: 'rgb(255, 255, 255)',
    outline: 'rgb(255, 255, 255)',
    outlineVariant: 'rgb(38, 38, 40)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(255, 255, 255)',
    inverseOnSurface: 'rgb(0, 0, 0)',
    inversePrimary: 'rgb(215, 26, 33)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(71, 70, 75)',
      level2: 'rgb(71, 70, 75)',
      level3: 'rgb(38, 38, 40)',
      level4: 'rgb(38, 38, 40)',
      level5: 'rgb(38, 38, 40)',
    },
    surfaceDisabled: 'rgba(255, 255, 255, 0.12)',
    onSurfaceDisabled: 'rgba(255, 255, 255, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};
