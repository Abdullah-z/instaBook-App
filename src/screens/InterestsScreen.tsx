import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Switch, useTheme, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const INTERESTS = [
  { id: 'weatherInFeedEnabled', title: 'Weather', desc: 'Local weather updates', icon: 'partly-sunny', colors: ['#3b82f6', '#22d3ee'] },
  { id: 'newsInFeedEnabled', title: 'News', desc: 'Top headlines globally', icon: 'newspaper', colors: ['#64748b', '#475569'] },
  { id: 'cryptoInFeedEnabled', title: 'Crypto', desc: 'Top coins by market cap', icon: 'logo-bitcoin', colors: ['#7c3aed', '#4f46e5'] },
  { id: 'cricketInFeedEnabled', title: 'Cricket Scores', desc: 'Live international matches', icon: 'baseball', colors: ['#15803d', '#065f46'] },
  { id: 'factInFeedEnabled', title: 'Daily Fact', desc: 'Interesting random facts', icon: 'bulb', colors: ['#d97706', '#b45309'] },
];

const InterestsScreen = () => {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    weatherInFeedEnabled: true,
    newsInFeedEnabled: true,
    cryptoInFeedEnabled: false,
    cricketInFeedEnabled: false,
    factInFeedEnabled: false,
  });

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const keys = INTERESTS.map(i => i.id);
        const stores = await AsyncStorage.multiGet(keys);
        const newPrefs = { ...preferences };
        stores.forEach(([key, value]) => {
          if (value !== null) {
            newPrefs[key] = value === 'true';
          }
        });
        setPreferences(newPrefs);
      } catch (e) {
        console.error('Failed to load interests preferences', e);
      }
    };
    loadPrefs();
  }, []);

  const toggleSwitch = async (id: string) => {
    const newValue = !preferences[id];
    setPreferences(prev => ({ ...prev, [id]: newValue }));
    try {
      await AsyncStorage.setItem(id, newValue ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save preference', e);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Feed Interests</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Choose what widget cards appear at the top of your feed.
        </Text>
      </View>

      <View style={styles.list}>
        {INTERESTS.map((interest) => {
          const isEnabled = preferences[interest.id];
          return (
            <Surface 
              key={interest.id} 
              style={[styles.card, { backgroundColor: theme.colors.surface }]} 
              elevation={1}
            >
              <View style={styles.cardContent}>
                <LinearGradient
                  colors={interest.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <Ionicons name={interest.icon as any} size={24} color="white" />
                </LinearGradient>
                <View style={styles.textContainer}>
                  <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
                    {interest.title}
                  </Text>
                  <Text style={[styles.itemDesc, { color: theme.colors.onSurfaceVariant }]}>
                    {interest.desc}
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => toggleSwitch(interest.id)}
                  color={theme.colors.primary}
                />
              </View>
            </Surface>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 14,
  },
});

export default InterestsScreen;
