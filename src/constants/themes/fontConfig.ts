import { Platform } from 'react-native';
import { configureFonts } from 'react-native-paper';

const baseFontConfig = {
  fontFamily: Platform.select({
    web: 'Montserrat-Regular, Arial, sans-serif',
    ios: 'Montserrat-Regular',
    default: 'Montserrat-Regular',
  }),
};

export const fontConfig = {
  fonts: configureFonts({
    config: {
      displayLarge: { ...baseFontConfig, fontSize: 57, lineHeight: 64, fontWeight: '400' },
      displayMedium: { ...baseFontConfig, fontSize: 45, lineHeight: 52, fontWeight: '400' },
      displaySmall: { ...baseFontConfig, fontSize: 36, lineHeight: 44, fontWeight: '400' },
      headlineLarge: { ...baseFontConfig, fontSize: 32, lineHeight: 40, fontWeight: '400' },
      headlineMedium: { ...baseFontConfig, fontSize: 28, lineHeight: 36, fontWeight: '400' },
      headlineSmall: { ...baseFontConfig, fontSize: 24, lineHeight: 32, fontWeight: '400' },
      titleLarge: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '500',
      },
      titleMedium: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
      },
      titleSmall: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
      },
      labelLarge: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
      },
      labelMedium: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
      },
      labelSmall: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
      },
      bodyLarge: { ...baseFontConfig, fontSize: 16, lineHeight: 24, fontWeight: '400' },
      bodyMedium: { ...baseFontConfig, fontSize: 14, lineHeight: 20, fontWeight: '400' },
      bodySmall: { ...baseFontConfig, fontSize: 12, lineHeight: 16, fontWeight: '400' },
      default: { ...baseFontConfig },
    } as any,
  }),
};
