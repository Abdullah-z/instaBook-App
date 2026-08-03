import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/axios';

const WEATHER_CACHE_KEY = '@cached_weather_data';

interface WeatherState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

const WeatherCard: React.FC = () => {
  // Single state object eliminates multiple re-renders from sequential setState calls
  const [state, setState] = useState<WeatherState>({ data: null, loading: false, error: null });
  const navigation = useNavigation<any>();
  const isMounted = useRef(true);

  // Helper: only update state if still mounted
  const safeSet = useCallback((patch: Partial<WeatherState>) => {
    if (isMounted.current) setState(prev => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // 1. Load cache first — instant, no flicker
    AsyncStorage.getItem(WEATHER_CACHE_KEY)
      .then(cached => {
        if (cached && isMounted.current) {
          try { safeSet({ data: JSON.parse(cached) }); } catch { /* ignore corrupt cache */ }
        }
      })
      .catch(() => {/* ignore */})
      .finally(() => {
        // 2. Only attempt live fetch if permission already granted
        ExpoLocation.getForegroundPermissionsAsync()
          .then(({ status }) => {
            if (status === 'granted' && isMounted.current) {
              fetchWeather(false); // silent background update — no spinner
            }
          })
          .catch(() => {/* ignore */});
      });

    return () => { isMounted.current = false; };
  }, []);

  const fetchWeather = useCallback(async (showLoading = true) => {
    // Show spinner only when explicitly requested AND we have no data
    if (showLoading && !state.data) {
      safeSet({ loading: true, error: null });
    } else {
      // Clear error silently without triggering spinner flash
      if (isMounted.current) setState(prev => ({ ...prev, error: null }));
    }

    try {
      let { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await ExpoLocation.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        safeSet({ loading: false, error: 'Location permission denied' });
        return;
      }

      // Prefer last-known location for speed (no GPS warm-up)
      let location = await ExpoLocation.getLastKnownPositionAsync({});
      if (!location) {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location timed out')), 10000)
        );
        location = await Promise.race([
          ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced }),
          timeout,
        ]);
      }

      const res = await API.get(
        `/external/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
      );
      const data = res.data?.data;
      if (data && isMounted.current) {
        // Single atomic update — no intermediate renders
        setState(prev => ({ ...prev, data, loading: false, error: null }));
        AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data)).catch(() => {});
      } else {
        safeSet({ loading: false });
      }
    } catch (err: any) {
      // If we already have cached data, swallow the error silently (no UI change)
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          // Only show error if we have nothing to display
          error: prev.data ? null : (err.message || 'Failed to fetch weather'),
        }));
      }
    }
  }, [state.data, safeSet]);

  const handlePress = () => {
    if (!navigation) return;
    try { navigation.navigate('WeatherNews' as never); } catch { /* ignore */ }
  };

  const { data: weather, loading, error } = state;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.88}>
      <LinearGradient
        colors={['#3b82f6', '#22d3ee']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="cloud" size={24} color="white" />
            <Text style={styles.title}>Local Weather</Text>
          </View>
          {!weather && !loading && (
            <TouchableOpacity style={styles.button} onPress={() => fetchWeather(true)}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.buttonText}>Get GPS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spinner only when we truly have nothing to show */}
        {loading && !weather && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {/* Error only when we have nothing to show */}
        {error && !weather && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Weather data — stable once loaded, no flicker */}
        {weather && (
          <View style={styles.weatherInfo}>
            <View>
              <Text style={styles.temp}>{Math.round(weather.main?.temp ?? 0)}°C</Text>
              <Text style={styles.city}>{weather.name}</Text>
              <Text style={styles.desc}>{weather.weather?.[0]?.description}</Text>
            </View>
            {weather.weather?.[0]?.icon && (
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png` }}
                style={styles.icon}
                contentFit="contain"
                // expo-image caches aggressively — use 'memory-disk' so it never flickers on re-render
                cachePolicy="memory-disk"
              />
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default memo(WeatherCard);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  loader: { paddingVertical: 20, alignItems: 'center' },
  errorContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 },
  errorText: { color: 'white', fontSize: 14 },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temp: { color: 'white', fontSize: 48, fontWeight: '900' },
  city: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  desc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textTransform: 'capitalize', marginTop: 2 },
  icon: { width: 100, height: 100 },
});
