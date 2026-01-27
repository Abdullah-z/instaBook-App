import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Text, Switch, useTheme } from 'react-native-paper';
import { useData } from '../hooks';

const COLORS = [
  { id: 'b', color: '#2196F3', label: 'Blue' },
  { id: 'g', color: '#4CAF50', label: 'Green' },
  { id: 'y', color: '#FFEB3B', label: 'Yellow' },
  { id: 'r', color: '#F44336', label: 'Red' },
  { id: 'p', color: '#9C27B0', label: 'Purple' },
  { id: 'o', color: '#FF9800', label: 'Orange' },
];

const ThemeSwitcher = () => {
  const { isDark, handleIsDark, themeColor, setThemeColor } = useData();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Dark Mode
        </Text>
        <Switch value={isDark} onValueChange={handleIsDark} color={theme.colors.primary} />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 10 }}>
          Theme Color
        </Text>
        <View style={styles.colorRow}>
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
                <Icon source="check" color={item.id === 'y' ? '#000' : '#fff'} size={16} />
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
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    borderColor: '#000',
    borderWidth: 2,
  },
});

export default ThemeSwitcher;
