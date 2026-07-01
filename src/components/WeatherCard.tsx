import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import API from '../api/axios';

const WeatherCard = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Add a timeout so the spinner doesn't hang indefinitely on devices
      // where GPS is slow or unavailable (common on Android emulators / low-signal devices).
      const locationPromise = ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
        timeInterval: 0,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out. Try again.')), 10000)
      );
      let location = await Promise.race([locationPromise, timeoutPromise]);
      
      const res = await API.get(`/external/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}`);
      setWeather(res.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if location permission was already granted before
  useEffect(() => {
    ExpoLocation.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        fetchWeather();
      }
    });
  }, []);

  return (
    <TouchableOpacity onPress={() => navigation.navigate('WeatherNews')} activeOpacity={0.9}>
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
            <TouchableOpacity style={styles.button} onPress={fetchWeather}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.buttonText}>Get GPS</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {weather && (
          <View style={styles.weatherInfo}>
            <View>
              <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
              <Text style={styles.city}>{weather.name}</Text>
              <Text style={styles.desc}>{weather.weather[0]?.description}</Text>
            </View>
            {weather.weather[0]?.icon && (
              <Image 
                source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png` }} 
                style={styles.icon} 
                contentFit="contain"
              />
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

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
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    paddingVertical: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
  },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temp: {
    color: 'white',
    fontSize: 48,
    fontWeight: '900',
  },
  city: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  desc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  icon: {
    width: 100,
    height: 100,
  },
});

export default WeatherCard;
