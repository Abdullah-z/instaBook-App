import { Platform } from 'react-native';
import { configureFonts } from 'react-native-paper';

const baseFontConfig = {
  fontFamily: Platform.select({
    web: 'Inter-Regular, Arial, sans-serif',
    ios: 'Inter-Regular',
    default: 'Inter-Regular',
  }),
};

export const fontConfig = {
  fonts: configureFonts({
    config: {
      displayLarge: {
        ...baseFontConfig,
        fontSize: 57,
        lineHeight: 64,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      displayMedium: {
        ...baseFontConfig,
        fontSize: 45,
        lineHeight: 52,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      displaySmall: {
        ...baseFontConfig,
        fontSize: 36,
        lineHeight: 44,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      headlineLarge: {
        ...baseFontConfig,
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      headlineMedium: {
        ...baseFontConfig,
        fontSize: 28,
        lineHeight: 36,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      headlineSmall: {
        ...baseFontConfig,
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      titleLarge: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      titleMedium: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      titleSmall: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      labelLarge: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
      },
      labelMedium: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
      },
      labelSmall: {
        fontFamily: 'Inter-Medium',
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
