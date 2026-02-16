import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Text, Switch, useTheme } from 'react-native-paper';
import { useData } from '../hooks';

const COLORS = [
  { id: 'g', color: '#3F6900', label: 'Green' },
  { id: 'b', color: '#00639A', label: 'Blue' },
  { id: 'p', color: '#6C577A', label: 'Purple' },
  { id: 'r', color: '#952B29', label: 'Red' },
  { id: 'o', color: '#8B5000', label: 'Orange' },
  { id: 'y', color: '#6E5D00', label: 'Yellow' },
  { id: 'np', color: '#FF1493', label: 'Neon Pink' },
  { id: 'nc', color: '#00FFFF', label: 'Neon Cyan' },
  { id: 'nl', color: '#CCFF00', label: 'Neon Lime' },
  { id: 'eb', color: '#7DF9FF', label: 'Electric Blue' },
  { id: 'po', color: '#FFB380', label: 'Pastel Orange' },
  { id: 'n', color: '#1B1B1D', label: 'Nothing' },
  { id: 'm', color: '#1A1C1E', label: 'Monochrome' },
];

const ThemeSwitcher = () => {
  const { isDark, handleIsDark, themeColor, setThemeColor } = useData();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.darkModeSection}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Dark Mode
        </Text>
        <Switch value={isDark} onValueChange={() => handleIsDark()} color={theme.colors.primary} />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Theme Color
        </Text>
        <View style={styles.colorGrid}>
          {COLORS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setThemeColor(item.id)}
              style={[
                styles.colorCircle,
                { backgroundColor: item.color },
                themeColor === item.id && styles.selectedCircle,
              ]}>
              {themeColor === item.id && (
                <Icon
                  source="check"
                  color={['nc', 'nl', 'eb', 'po'].includes(item.id) ? '#000' : '#fff'}
                  size={16}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  darkModeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    borderColor: '#000',
    borderWidth: 3,
  },
});

export default ThemeSwitcher;
