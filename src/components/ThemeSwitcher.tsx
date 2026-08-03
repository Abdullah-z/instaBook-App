import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Icon, Text, Switch, useTheme } from 'react-native-paper';
import { useData } from '../hooks';

const COLORS = [
  { id: 'spectrum', color: '#FF0077', label: 'Spectrum', emoji: '🌈' },
  { id: 'oled',     color: '#000000', label: 'OLED Black', emoji: '⚫' },
  { id: 'genz',     color: '#FF007F', label: 'Gen-Z', emoji: '⚡' },
  { id: 'g',        color: '#3F6900', label: 'Green', emoji: '🌿' },
  { id: 'b',        color: '#00639A', label: 'Blue', emoji: '🫐' },
  { id: 'p',        color: '#6C577A', label: 'Purple', emoji: '🔮' },
  { id: 'r',        color: '#952B29', label: 'Red', emoji: '❤️' },
  { id: 'o',        color: '#8B5000', label: 'Orange', emoji: '🍊' },
  { id: 'y',        color: '#6E5D00', label: 'Yellow', emoji: '🌟' },
  { id: 'np',       color: '#FF1493', label: 'Neon Pink', emoji: '🩷' },
  { id: 'nc',       color: '#00FFFF', label: 'Neon Cyan', emoji: '💠' },
  { id: 'nl',       color: '#CCFF00', label: 'Neon Lime', emoji: '🟢' },
  { id: 'eb',       color: '#7DF9FF', label: 'Electric', emoji: '🔵' },
  { id: 'po',       color: '#FFB380', label: 'Pastel', emoji: '🍑' },
  { id: 'n',        color: '#1B1B1D', label: 'Nothing', emoji: '◽' },
  { id: 'm',        color: '#1A1C1E', label: 'Mono', emoji: '🩶' },
];

// IDs where the checkmark should be dark (light-coloured swatches)
const LIGHT_SWATCH_IDS = new Set(['nc', 'nl', 'eb', 'po', 'spectrum']);

const ThemeSwitcher = () => {
  const { isDark, handleIsDark, themeColor, setThemeColor } = useData();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Dark Mode toggle */}
      <View style={styles.darkModeRow}>
        <View style={styles.darkModeLeft}>
          <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
            Dark Mode
          </Text>
          <Text style={[styles.sectionSub, { color: theme.colors.onSurfaceVariant }]}>
            {isDark ? 'Currently dark' : 'Currently light'}
          </Text>
        </View>
        <Switch value={isDark} onValueChange={() => handleIsDark()} color={theme.colors.primary} />
      </View>

      {/* Theme colour grid */}
      <Text style={[styles.sectionLabel, { color: theme.colors.onSurface, marginBottom: 14 }]}>
        Theme Palette
      </Text>

      <View style={styles.grid}>
        {COLORS.map((item) => {
          const isSelected = themeColor === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setThemeColor(item.id)}
              activeOpacity={0.75}
              style={[
                styles.swatch,
                { backgroundColor: theme.colors.elevation.level2 },
                isSelected && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              {/* Colour dot */}
              <View style={[styles.dot, { backgroundColor: item.color }]}>
                {isSelected && (
                  <Icon
                    source="check"
                    color={LIGHT_SWATCH_IDS.has(item.id) ? '#000' : '#fff'}
                    size={13}
                  />
                )}
              </View>
              {/* Label */}
              <Text
                numberOfLines={1}
                style={[
                  styles.swatchLabel,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {item.emoji} {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ThemeSwitcher;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  darkModeLeft: {
    gap: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: '30%',
    flexGrow: 1,
    maxWidth: '31%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
});
