import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Alert, Modal, Switch, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLocation from 'expo-location';
import { getRobustLocation } from '../utils/locationHelper';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import moment from 'moment';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../auth/AuthContext';
import { useTheme } from 'react-native-paper';
import { generateCityImage } from '../api/geminiService';

// Static Asset
const weatherBg = require('../../assets/weather_bg.jpg');

const { width, height } = Dimensions.get('window');

const API_KEY = '6cc098a44449cf3468d194cae0f91b47';
const UNSPLASH_ACCESS_KEY = 'j67xuJY4yvRW8UprInTOzcA8XVdxb9YEAlBl_KN4nlU';

const WeatherNewsScreen = () => {
  const { isAmbientEnabled } = useContext(AuthContext);
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('Lahore');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  // Location suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Gemini State
  const [generatedBgImage, setGeneratedBgImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Data States
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [detailsData, setDetailsData] = useState<any>({
    feelsLike: '0°',
    humidity: '0%',
    pressure: '0 hPa',
    visibility: '0 km',
    sunrise: '00:00',
    sunset: '00:00',
    sunriseTs: 0,
    sunsetTs: 0,
    windSpeed: '0',
    windDir: 'N',
    windDeg: 0,
    aqi: 0,
    aqiDesc: '',
    humidityVal: 0,
  });

  // News State
  const [activeTab, setActiveTab] = useState<'weather' | 'news'>('weather');
  const [newsData, setNewsData] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'news' && newsData.length === 0) {
      fetchNews();
    }
  }, [activeTab]);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const response = await axios.get(
        'https://newsapi.org/v2/top-headlines?country=us&apiKey=25b905674f0149bd819b4f8e242f7350'
      );
      setNewsData(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleNewsPress = async (url: string) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  // Helpers
  const mapIcon = (code: string) => {
    switch (code) {
      case '01d':
        return 'sunny';
      case '01n':
        return 'moon';
      case '02d':
        return 'partly-sunny';
      case '02n':
        return 'cloudy-night';
      case '03d':
      case '03n':
        return 'cloud';
      case '04d':
      case '04n':
        return 'cloudy';
      case '09d':
      case '09n':
        return 'rainy';
      case '10d':
      case '10n':
        return 'rainy';
      case '11d':
      case '11n':
        return 'thunderstorm';
      case '13d':
      case '13n':
        return 'snow';
      case '50d':
      case '50n':
        return 'reorder-two';
      default:
        return 'cloud';
    }
  };

  const getWindDirection = (deg: number) => {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    return arr[val % 16];
  };

  const linear = (Ihi: number, Ilo: number, BPhi: number, BPlo: number, C: number) => {
    return ((Ihi - Ilo) / (BPhi - BPlo)) * (C - BPlo) + Ilo;
  };

  const calculateUS_AQI = (pm25: number) => {
    let aqi = 0;
    let label = 'Good';
    if (pm25 <= 12.0) {
      aqi = linear(50, 0, 12, 0, pm25);
      label = 'Good';
    } else if (pm25 <= 35.4) {
      aqi = linear(100, 51, 35.4, 12.1, pm25);
      label = 'Moderate';
    } else if (pm25 <= 55.4) {
      aqi = linear(150, 101, 55.4, 35.5, pm25);
      label = 'Unhealthy for Sensitive Groups';
    } else if (pm25 <= 150.4) {
      aqi = linear(200, 151, 150.4, 55.5, pm25);
      label = 'Unhealthy';
    } else if (pm25 <= 250.4) {
      aqi = linear(300, 201, 250.4, 150.5, pm25);
      label = 'Very Unhealthy';
    } else {
      aqi = linear(500, 301, 500.4, 250.5, pm25);
      label = 'Hazardous';
    }
    return { index: Math.round(aqi), label };
  };

  const getAQIStatement = (aqi: number) => {
    if (aqi <= 50) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
    if (aqi <= 100)
      return 'Air quality is acceptable. However, there may be a risk for some people.';
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects.';
    if (aqi <= 200) return 'Everyone may begin to experience health effects.';
    if (aqi <= 300)
      return 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
    return 'Health alert: everyone may experience more serious health effects.';
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchWeatherData(searchQuery, unit);
  }, [unit]); // Refetch when unit changes

  const fetchWeatherData = async (
    city: string,
    unitSystem: 'metric' | 'imperial',
    lat?: number,
    lon?: number
  ) => {
    if (!city && lat === undefined) return;
    setLoading(true);
    try {
      // Fetch Current Weather
      let currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unitSystem}`;
      if (lat !== undefined && lon !== undefined) {
        currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unitSystem}`;
      }
      const currentRes = await fetch(currentUrl);
      const currentData = await currentRes.json();

      if (currentData.cod !== 200) {
        Alert.alert('Error', currentData.message || 'City not found');
        setLoading(false);
        return;
      }

      // Fetch Forecast (5 day / 3 hour)
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unitSystem}`;
      if (lat !== undefined && lon !== undefined) {
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unitSystem}`;
      }
      const forecastRes = await fetch(forecastUrl);
      const forecastData = await forecastRes.json();

      // Fetch Air Quality
      const aqiRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${API_KEY}`
      );
      const aqiData = await aqiRes.json();

      // Process Data
      setCurrentWeather(currentData);
      processForecast(forecastData.list);

      const components = aqiData.list?.[0]?.components || {};
      const pm2_5 = components.pm2_5 || 0;
      const { index, label } = calculateUS_AQI(pm2_5);

      // Update Details
      setDetailsData({
        feelsLike: `${Math.round(currentData.main.feels_like)}°`,
        humidity: `${currentData.main.humidity}%`,
        pressure: `${currentData.main.pressure} hPa`,
        visibility: `${(currentData.visibility / 1000).toFixed(1)} km`,
        sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sunriseTs: currentData.sys.sunrise * 1000,
        sunsetTs: currentData.sys.sunset * 1000,
        windSpeed: `${currentData.wind.speed} ${unitSystem === 'metric' ? 'm/s' : 'mph'}`,
        windDir: getWindDirection(currentData.wind.deg),
        windDeg: currentData.wind.deg,
        aqi: index,
        aqiDesc: label,
        humidityVal: currentData.main.humidity,
      });

      setSearchQuery(currentData.name);
      setIsSearching(false);

      // Generate City Image
      updateCityImage(currentData.name, currentData.weather[0].main);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const updateCityImage = async (cityName: string, condition?: string) => {
    setIsGeneratingImage(true);
    try {
      // 1. Try Unsplash API for high-quality contextual images
      const searchQuery = condition ? `${cityName} ${condition}` : cityName;
      const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        searchQuery
      )}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

      const response = await axios.get(unsplashUrl);
      if (response.data && response.data.urls && response.data.urls.regular) {
        setGeneratedBgImage(response.data.urls.regular);
        return;
      }

      // 2. Fallback to LoremFlickr if Unsplash fails or returns empty
      const fallbackUrl = `https://loremflickr.com/1024/768/${encodeURIComponent(cityName)},city,landscape/all`;
      setGeneratedBgImage(fallbackUrl);
    } catch (error) {
      console.error('Image Generation Error:', error);
      // 3. Robust fallback
      const fallbackUrl = `https://loremflickr.com/1024/768/${encodeURIComponent(cityName)},city,landscape/all`;
      setGeneratedBgImage(fallbackUrl);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const processForecast = (list: any[]) => {
    if (!list) return;

    // 1. Hourly Data (Take next 8 items)
    const nextHours = list.slice(0, 8).map((item: any) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(item.main.temp),
      icon: mapIcon(item.weather[0].icon),
      pop: item.pop > 0 ? `${Math.round(item.pop * 100)}%` : '',
      isSunny:
        item.weather[0].icon.includes('d') &&
        (item.weather[0].icon === '01d' || item.weather[0].icon === '02d'),
    }));
    setHourlyData(nextHours);

    // 2. Daily Data
    const dailyMap = new Map();
    list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!dailyMap.has(day)) {
        dailyMap.set(day, {
          day,
          icon: mapIcon(item.weather[0].icon),
          condition: item.weather[0].main,
          min: item.main.temp_min,
          max: item.main.temp_max,
        });
      } else {
        const existing = dailyMap.get(day);
        existing.min = Math.min(existing.min, item.main.temp_min);
        existing.max = Math.max(existing.max, item.main.temp_max);
      }
    });

    const dailyArray = Array.from(dailyMap.values())
      .slice(1, 6)
      .map((d) => ({
        ...d,
        high: Math.round(d.max),
        low: Math.round(d.min),
      }));
    setDailyData(dailyArray);
  };

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      let { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let loc = await getRobustLocation();

      if (loc) {
        await fetchWeatherData('', unit, loc.coords.latitude, loc.coords.longitude);
      }
    } catch (error) {
      console.error('Location Error:', error);
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const searchLocation = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lang=en`
      );
      const data = await response.json();

      const formattedSuggestions = data.features.map((feature: any) => {
        const p = feature.properties;
        const parts = [p.name, p.city, p.country].filter(Boolean);
        return {
          description: parts.join(', '),
          coordinates: feature.geometry.coordinates, // [lon, lat]
          name: p.name || p.city,
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const handleSearchSubmit = () => {
    fetchWeatherData(searchQuery, unit);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (item: any) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    fetchWeatherData(item.name, unit, item.coordinates[1], item.coordinates[0]);
  };

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  // --- WIDGET COMPONENTS ---

  // --- WIDGET COMPONENTS ---

  const WeatherWidget = ({
    title,
    icon,
    color,
    children,
    fullWidth,
    rotateIcon,
    bgFillPercentage,
    headerColor,
  }: any) => {
    // Calculation: (Screen Width - Padding * 2 - Gap) / 2
    // Width - 40 (padding) - 16 (gap) = Width - 56.
    // Use Width - 60 to be safe and ensure they fit 2 per row.
    const cardWidth = fullWidth ? '100%' : (width - 60) / 2;
    const waterColor = headerColor || (theme.dark ? 'rgba(144, 202, 249, 0.3)' : '#90CAF9');

    // Adjust widget background color for dark mode if it's too bright
    const widgetBg = theme.dark ? 'rgba(255,255,255,0.08)' : color;
    const textColor = theme.dark ? theme.colors.onSurface : '#444';
    const subTextColor = theme.dark ? theme.colors.onSurfaceVariant : '#666';

    return (
      <View
        style={[
          styles.widgetCard,
          {
            backgroundColor: widgetBg,
            width: cardWidth,
            overflow: 'hidden',
            padding: 0,
            elevation: theme.dark ? 0 : 2,
            borderWidth: theme.dark ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.1)',
          },
        ]}>
        {/* Layer 1: Background Fill for Humidity (Dynamic height) */}
        {bgFillPercentage !== undefined && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${bgFillPercentage}%`,
              backgroundColor: waterColor,
              zIndex: -10,
            }}
          />
        )}

        {/* Layer 3: Contents (Foreground) */}
        <View
          style={[styles.widgetHeader, { paddingHorizontal: 16, paddingTop: 16, marginBottom: 0 }]}>
          <Ionicons
            name={icon}
            size={18}
            color={textColor}
            style={rotateIcon !== undefined ? { transform: [{ rotate: `${rotateIcon}deg` }] } : {}}
          />
          <Text style={[styles.widgetTitle, { color: textColor }]}>{title}</Text>
        </View>
        <View style={[styles.widgetContent, { paddingHorizontal: 16, paddingBottom: 16 }]}>
          {children}
        </View>
      </View>
    );
  };

  const SunWidget = () => {
    const now = Date.now();
    const { sunriseTs, sunsetTs } = detailsData;

    let progress = 0;
    let isDay = false;

    if (sunriseTs && sunsetTs) {
      if (now >= sunriseTs && now <= sunsetTs) {
        // Daytime
        isDay = true;
        progress = (now - sunriseTs) / (sunsetTs - sunriseTs);
      } else {
        // Nighttime dynamic position
        isDay = false;
        const dayDuration = sunsetTs - sunriseTs;
        const nightDuration = 24 * 60 * 60 * 1000 - dayDuration;

        let timeIntoNight;
        if (now > sunsetTs) {
          timeIntoNight = now - sunsetTs;
        } else {
          // It's after midnight but before sunrise
          // We assume sunset was ~24h before tomorrow's sunset
          timeIntoNight = now + 24 * 60 * 60 * 1000 - sunsetTs;
        }

        progress = Math.min(Math.max(timeIntoNight / nightDuration, 0), 1);
      }
    }

    const rotation = -90 + progress * 180; // -90 (Left) to 90 (Right)

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {/* Full Circle Track */}
        <View
          style={{
            height: 80, // Full Circle Height
            width: 80,
            alignItems: 'center',
            justifyContent: 'center', // Center content
            marginBottom: 5,
            marginTop: 5,
          }}>
          <View
            style={{
              width: 80, // Full circle diameter
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#FFCC80', // Full ring color
              // backgroundColor: 'rgba(255, 204, 128, 0.2)', // Optional fill
              position: 'absolute',
              top: 0,
              // transform: [{ rotate: '-45deg' }], // No rotation needed for full ring
            }}
          />

          {/* Horizon Line (Middle) */}
          <View
            style={{
              position: 'absolute',
              width: '120%',
              height: 1,
              backgroundColor: '#FFCC80',
              opacity: 0.5,
            }}
          />

          {/* Sunrise/Sunset Dots */}
          <View
            style={{
              position: 'absolute',
              left: -3,
              top: 37,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#FFCC80',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: -3,
              top: 37,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#FFCC80',
            }}
          />

          {/* Sun/Moon Indicator */}
          {(() => {
            const r = 40; // radius

            // Map progress to angle based on isDay
            // Daytime: 180deg (Left) -> 270deg (Top) -> 360deg (Right)
            // Nighttime: 0deg (Right) -> 90deg (Bottom) -> 180deg (Left)
            const mathAngle = isDay ? Math.PI + progress * Math.PI : progress * Math.PI;

            const top = 40 + Math.sin(mathAngle) * r;
            const left = 40 + Math.cos(mathAngle) * r;

            return (
              <View
                style={{
                  position: 'absolute',
                  top: top - 6, // center circle (size 12)
                  left: left - 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Glow/Shadow for the circle
                  shadowColor: isDay ? '#FF9800' : '#FFF',
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 5,
                }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#FFF',
                    borderWidth: 2,
                    borderColor: isDay ? '#FFCC80' : '#FFF',
                  }}
                />
              </View>
            );
          })()}
        </View>

        <View style={styles.sunRow}>
          <Ionicons name="sunny-outline" size={16} color={theme.colors.onSurface} />
          <Text style={[styles.sunText, { color: theme.colors.onSurface }]}>
            {detailsData.sunrise}
          </Text>
        </View>
        <View style={styles.sunRow}>
          <Ionicons name="moon-outline" size={16} color={theme.colors.onSurface} />
          <Text style={[styles.sunText, { color: theme.colors.onSurface }]}>
            {detailsData.sunset}
          </Text>
        </View>
      </View>
    );
  };

  const AQICard = ({ aqi, desc }: { aqi: number; desc: string }) => {
    // Calculate percentage for indicator (0-300 scale usually)
    const percentage = Math.max(0, Math.min(100, (aqi / 300) * 100));

    return (
      <View
        style={[
          styles.aqiCard,
          {
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : theme.colors.onSurfaceVariant,
            borderWidth: 1,
            elevation: theme.dark ? 0 : 1,
            borderRadius: 24, // Explicitly ensure radius is applied
          },
        ]}>
        <View style={styles.aqiHeader}>
          <Ionicons name="filter-outline" size={20} color={theme.colors.onSurface} />
          <Text style={[styles.aqiTitle, { color: theme.colors.onSurface }]}>Air quality</Text>
        </View>

        <Text style={[styles.aqiCurrentLabel, { color: theme.colors.onSurfaceVariant }]}>
          Current condition
        </Text>
        <View style={styles.aqiValueContainer}>
          <Text style={[styles.aqiValueLarge, { color: theme.colors.onSurface }]}>{aqi}</Text>
          <Text style={[styles.aqiStatusText, { color: theme.colors.onSurfaceVariant }]}>
            {desc}
          </Text>
        </View>

        <View style={styles.aqiBarContainer}>
          <LinearGradient
            colors={['#4CAF50', '#FFEB3B', '#FF9800', '#F44336', '#9C27B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aqiGradient}
          />
          <View style={[styles.aqiIndicator, { left: `${percentage}%`, marginLeft: -6 }]} />
        </View>

        <Text style={[styles.aqiStatement, { color: theme.colors.onSurfaceVariant }]}>
          {getAQIStatement(aqi)}
        </Text>
      </View>
    );
  };

  if (loading && !currentWeather) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Immersive Full-Screen Blurred Background */}
      {isAmbientEnabled && (
        <View style={StyleSheet.absoluteFill}>
          {generatedBgImage ? (
            <Image
              source={{ uri: generatedBgImage }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Image source={weatherBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )}
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={100}
            tint={theme.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header with Tabs */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            {/* Header settings icon reused if needed, or simplified */}
          </View>

          {/* Custom Tab Switcher */}
          <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'weather' && {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.shadow,
                },
              ]}
              onPress={() => setActiveTab('weather')}>
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.onSurfaceVariant },
                  activeTab === 'weather' && { color: theme.colors.primary },
                ]}>
                Weather
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'news' && {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.shadow,
                },
              ]}
              onPress={() => setActiveTab('news')}>
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.onSurfaceVariant },
                  activeTab === 'news' && { color: theme.colors.primary },
                ]}>
                Top Stories
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'weather' ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Weather Card Section */}
            <View style={styles.weatherCard}>
              {generatedBgImage ? (
                <Image
                  source={{ uri: generatedBgImage }}
                  style={styles.cardBgImage}
                  resizeMode="cover"
                />
              ) : (
                <Image source={weatherBg} style={styles.cardBgImage} resizeMode="cover" />
              )}

              {isGeneratingImage && (
                <View
                  style={[
                    styles.cardBgImage,
                    {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'absolute',
                      zIndex: 10,
                    },
                  ]}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 10, marginTop: 5 }}>
                    Generating City View...
                  </Text>
                </View>
              )}

              <View style={styles.cardOverlay}>
                {/* Header Actions */}
                <View style={styles.modernHeader}>
                  <TouchableOpacity
                    style={styles.glassIconButton}
                    onPress={() => setSettingsVisible(true)}>
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                  </TouchableOpacity>

                  {isSearching ? (
                    <View style={styles.modernSearchCard}>
                      <TextInput
                        style={styles.modernSearchInput}
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          searchLocation(text);
                        }}
                        onSubmitEditing={handleSearchSubmit}
                        placeholder="Search City..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleSearchSubmit}>
                        <Ionicons name="search" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.modernLocationBadge}
                      onPress={() => {
                        setSearchQuery('');
                        setIsSearching(true);
                      }}>
                      <Ionicons name="location" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.modernLocationName} numberOfLines={1}>
                        {currentWeather?.name || 'Search...'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.glassIconButton}
                    onPress={getCurrentLocation}
                    disabled={isLocationLoading}>
                    {isLocationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="navigate-outline" size={22} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Suggestions Overlay */}
                {isSearching && showSuggestions && suggestions.length > 0 && (
                  <View style={styles.floatingSuggestions}>
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.floatingSuggestionItem}
                        onPress={() => handleSuggestionSelect(item)}>
                        <Ionicons name="location-outline" size={16} color="#fff" />
                        <Text style={styles.floatingSuggestionText} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Central Info Panel (Localized Blur) */}
                <BlurView
                  experimentalBlurMethod="dimezisBlurView"
                  intensity={isAmbientEnabled ? 80 : 0}
                  tint="dark"
                  style={styles.modernCenterInfoPanel}>
                  <View style={styles.modernTempContainer}>
                    {currentWeather?.weather?.[0]?.icon && (
                      <Image
                        source={{
                          uri: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`,
                        }}
                        style={styles.modernWeatherIcon}
                      />
                    )}
                    <Text style={styles.modernTempText}>
                      {Math.round(currentWeather?.main?.temp || 0)}°
                    </Text>
                  </View>
                  <View style={styles.modernConditionBadge}>
                    <Text style={styles.modernConditionText}>
                      {currentWeather?.weather?.[0]?.description
                        ? currentWeather.weather[0].description.charAt(0).toUpperCase() +
                          currentWeather.weather[0].description.slice(1)
                        : '--'}
                    </Text>
                  </View>
                  <View style={styles.modernHighLowRow}>
                    <Text style={styles.modernHighLowText}>
                      H: {Math.round(currentWeather?.main?.temp_max || 0)}° L:{' '}
                      {Math.round(currentWeather?.main?.temp_min || 0)}°
                    </Text>
                  </View>
                </BlurView>

                {/* Bottom Quick Stats (Localized Blur) */}
                <BlurView
                  experimentalBlurMethod="dimezisBlurView"
                  intensity={isAmbientEnabled ? 80 : 0}
                  tint="dark"
                  style={styles.modernQuickStatsPanel}>
                  <View style={styles.quickStatItem}>
                    <Ionicons name="water-outline" size={18} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.quickStatValue}>{currentWeather?.main?.humidity}%</Text>
                    <Text style={styles.quickStatLabel}>Humidity</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStatItem}>
                    <Ionicons name="navigate-outline" size={18} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.quickStatValue}>
                      {currentWeather?.wind?.speed} {unit === 'metric' ? 'm/s' : 'mph'}
                    </Text>
                    <Text style={styles.quickStatLabel}>Wind</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStatItem}>
                    <Ionicons name="leaf-outline" size={18} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.quickStatValue}>{detailsData.aqi}</Text>
                    <Text style={styles.quickStatLabel}>AQI</Text>
                  </View>
                </BlurView>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <View
                style={[styles.dragHandle, { backgroundColor: theme.colors.onSurfaceVariant }]}
              />

              {/* Hourly Section */}
              <Text style={[styles.sectionTitleBlack, { color: theme.colors.onSurface }]}>
                Hourly Forecast
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyList}>
                {hourlyData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.hourlyItem,
                      {
                        backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#f9f9f9',
                        elevation: 0,
                        borderWidth: theme.dark ? 1 : 0,
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                    ]}>
                    <Text
                      style={[styles.hourlyTimeBlack, { color: theme.colors.onSurfaceVariant }]}>
                      {item.time}
                    </Text>
                    <Ionicons
                      name={item.icon as any}
                      size={28}
                      color={item.isSunny ? '#fdb813' : theme.colors.secondary}
                      style={styles.hourlyIcon}
                    />
                    <Text style={[styles.hourlyTempBlack, { color: theme.colors.onSurface }]}>
                      {item.temp}°
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* AQI Card Section */}
              {detailsData.aqi !== undefined && (
                <AQICard aqi={detailsData.aqi} desc={detailsData.aqiDesc} />
              )}

              {/* Daily Section */}
              <Text
                style={[
                  styles.sectionTitleBlack,
                  { marginTop: 25, color: theme.colors.onSurface },
                ]}>
                Daily Forecast
              </Text>
              <View style={styles.dailyList}>
                {dailyData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dailyItem,
                      { borderBottomColor: theme.colors.onSurfaceVariant },
                    ]}>
                    <Text style={[styles.dailyDay, { color: theme.colors.onSurface }]}>
                      {item.day}
                    </Text>
                    <View style={styles.dailyConditionContainer}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={item.icon === 'sunny' ? '#fdb813' : theme.colors.secondary}
                      />
                      <Text
                        style={[styles.dailyCondition, { color: theme.colors.onSurfaceVariant }]}>
                        {item.condition}
                      </Text>
                    </View>
                    <View style={styles.dailyTemps}>
                      <Text style={[styles.tempHigh, { color: theme.colors.onSurface }]}>
                        {item.high}°
                      </Text>
                      <Text style={[styles.tempLow, { color: theme.colors.onSurfaceVariant }]}>
                        {item.low}°
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Details Section (Widget Grid) */}
              <Text
                style={[
                  styles.sectionTitleBlack,
                  { marginTop: 25, color: theme.colors.onSurface },
                ]}>
                Current Details
              </Text>
              <View style={styles.widgetGrid}>
                <WeatherWidget title="Wind" icon="navigate-outline" color="#FBE9E7">
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      overflow: 'hidden',
                    }}>
                    <Ionicons
                      name="navigate-outline"
                      size={140}
                      color={theme.dark ? theme.colors.onSurface : '#333'}
                      style={{
                        position: 'absolute',
                        opacity: 0.1,
                        // navigate-outline points NE (45deg). We want to point to Source (windDeg).
                        // If Wind is North (0), we want Visual 0.
                        // Rotation = Target - Initial = 0 - 45 = -45.
                        transform: [{ rotate: `${(detailsData.windDeg || 0) - 45}deg` }],
                      }}
                    />
                    <Text style={[styles.widgetBigValue, { color: theme.colors.onSurface }]}>
                      {detailsData.windSpeed}
                    </Text>
                    <Text style={[styles.widgetSubValue, { color: theme.colors.onSurfaceVariant }]}>
                      From {detailsData.windDir}
                    </Text>
                  </View>
                </WeatherWidget>

                <WeatherWidget title="Sunrise & Sunset" icon="sunny-outline" color="#FFF3E0">
                  <SunWidget />
                </WeatherWidget>

                {/* Row 2: Humidity & Visibility */}
                <WeatherWidget
                  title="Humidity"
                  icon="water-outline"
                  color="#E1F5FE"
                  bgFillPercentage={detailsData.humidityVal}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={[styles.widgetBigValue, { color: theme.colors.onSurface }]}>
                      {detailsData.humidity}
                    </Text>
                    <Text style={[styles.widgetSubValue, { color: theme.colors.onSurfaceVariant }]}>
                      Dew point:{' '}
                      {Math.round(
                        currentWeather.main.temp - (100 - currentWeather.main.humidity) / 5
                      )}
                      °
                    </Text>
                  </View>
                </WeatherWidget>

                <WeatherWidget title="Visibility" icon="eye-outline" color="#F3E5F5">
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={[styles.widgetBigValue, { color: theme.colors.onSurface }]}>
                      {detailsData.visibility}
                    </Text>
                    <Text style={[styles.widgetSubValue, { color: theme.colors.onSurfaceVariant }]}>
                      Clear View
                    </Text>
                  </View>
                </WeatherWidget>

                {/* Row 3: Pressure & Feels Like */}
                <WeatherWidget title="Pressure" icon="speedometer-outline" color="#ECEFF1">
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={[styles.widgetBigValue, { color: theme.colors.onSurface }]}>
                      {detailsData.pressure}
                    </Text>
                    <Text style={[styles.widgetSubValue, { color: theme.colors.onSurfaceVariant }]}>
                      hPa
                    </Text>
                  </View>
                </WeatherWidget>

                <WeatherWidget title="Feels Like" icon="thermometer-outline" color="#E8F5E9">
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={[styles.widgetBigValue, { color: theme.colors.onSurface }]}>
                      {detailsData.feelsLike}
                    </Text>
                    <Text style={[styles.widgetSubValue, { color: theme.colors.onSurfaceVariant }]}>
                      Actual: {Math.round(currentWeather.main.temp)}°
                    </Text>
                  </View>
                </WeatherWidget>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {newsLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>
                  Loading headlines...
                </Text>
              </View>
            ) : (
              <FlatList
                data={newsData}
                keyExtractor={(item: any, index: number) => index.toString()}
                contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                renderItem={({ item }: any) => (
                  <TouchableOpacity
                    style={[
                      styles.newsCard,
                      {
                        backgroundColor: theme.colors.surface,
                        shadowColor: theme.colors.shadow,
                        elevation: theme.dark ? 0 : 2,
                        borderWidth: theme.dark ? 1 : 0,
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                    ]}
                    onPress={() => handleNewsPress(item.url)}
                    activeOpacity={0.9}>
                    {item.urlToImage ? (
                      <Image source={{ uri: item.urlToImage }} style={styles.newsImage} />
                    ) : (
                      <View
                        style={[
                          styles.newsImage,
                          {
                            backgroundColor: theme.colors.surface,
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}>
                        <Ionicons
                          name="newspaper-outline"
                          size={40}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                    )}
                    <View style={styles.newsContent}>
                      <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
                        {item.source?.name || 'News'}
                      </Text>
                      <Text
                        style={[styles.newsTitle, { color: theme.colors.onSurface }]}
                        numberOfLines={3}>
                        {item.title}
                      </Text>
                      <Text style={[styles.newsTime, { color: theme.colors.onSurfaceVariant }]}>
                        {moment(item.publishedAt).fromNow()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={settingsVisible}
          onRequestClose={() => setSettingsVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Settings</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                    Temperature Unit
                  </Text>
                  <Text style={[styles.settingSubLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Current: {unit === 'metric' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
                  thumbColor={unit === 'imperial' ? theme.colors.primary : theme.colors.outline}
                  onValueChange={toggleUnit}
                  value={unit === 'imperial'}
                />
              </View>

              <Text style={[styles.modalFooter, { color: theme.colors.onSurfaceVariant }]}>
                Weather data provided by OpenWeatherMap
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // New Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  // News Styles
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  newsContent: {
    padding: 15,
  },
  newsSource: {
    fontSize: 12,
    color: '#1877F2',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsTime: {
    fontSize: 12,
    color: '#999',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  weatherCard: {
    height: height * 0.5,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardBgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
    justifyContent: 'space-between',
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  glassIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modernLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    maxWidth: width * 0.5,
  },
  modernLocationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modernSearchCard: {
    flex: 1,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  modernSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  floatingSuggestions: {
    position: 'absolute',
    top: 65,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20,20,30,0.9)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  floatingSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  floatingSuggestionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
  modernCenterInfoPanel: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 20,
    overflow: 'hidden',
  },
  modernTempContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 140,
    width: 200,
  },
  modernTempText: {
    fontSize: 90,
    fontWeight: '300',
    color: '#fff',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modernWeatherIcon: {
    position: 'absolute',
    width: 250,
    height: 250,
    opacity: 0.5,
  },
  modernConditionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: -5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modernConditionText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
  },
  modernHighLowRow: {
    marginTop: 10,
  },
  modernHighLowText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  modernQuickStatsPanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionTitleBlack: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  hourlyList: {
    marginBottom: 10,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 25,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 15,
    minWidth: 70,
  },
  hourlyTimeBlack: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
  },
  hourlyTempBlack: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  hourlyIcon: {
    // marginVertical: 5,
  },
  // AQI Card Styles
  aqiCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 0,
  },
  aqiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aqiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  aqiCurrentLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  aqiValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  aqiValueLarge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 56,
  },
  aqiStatusText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 10,
  },
  aqiBarContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginVertical: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  aqiGradient: {
    flex: 1,
    borderRadius: 4,
  },
  aqiIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#4CAF50', // Dynamic color would be better, but fixed for now
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    top: -6, // Center vertically on bar
  },
  aqiStatement: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 5,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 15,
    padding: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  // Existing Styles...
  dailyList: {
    marginTop: 5,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dailyDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 90,
  },
  dailyConditionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyCondition: {
    color: '#555',
    fontSize: 15,
    marginLeft: 10,
  },
  dailyTemps: {
    flexDirection: 'row',
  },
  tempHigh: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 12,
  },
  tempLow: {
    fontSize: 16,
    color: '#888',
  },
  // --- WIDGET STYLES ---
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // Requires React Native 0.71+, else use margin (which we handle in component width)
    justifyContent: 'space-between',
  },
  widgetCard: {
    aspectRatio: 1, // Make it square
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginLeft: 8,
  },
  widgetContent: {
    flex: 1,
    justifyContent: 'center',
  },
  widgetBigValue: {
    fontSize: 28, // Large number
    fontWeight: 'bold',
    color: '#222',
  },
  widgetSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  // Specific Widget Inner Styles
  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sunText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingSubLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  modalFooter: {
    marginTop: 20,
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
  },
});

export default WeatherNewsScreen;
