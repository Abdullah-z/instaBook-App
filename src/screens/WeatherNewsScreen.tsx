import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Static Asset
const weatherBg = require('../../assets/weather_bg.jpg');

const { width, height } = Dimensions.get('window');

const API_KEY = '6cc098a44449cf3468d194cae0f91b47';

const WeatherNewsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('Lahore');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

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
    windSpeed: '0',
    windDir: 'N',
    aqi: 0,
    aqiDesc: '',
  });

  useEffect(() => {
    fetchWeatherData(searchQuery, unit);
  }, [unit]); // Refetch when unit changes

  const fetchWeatherData = async (city: string, unitSystem: 'metric' | 'imperial') => {
    if (!city) return;
    setLoading(true);
    try {
      // Fetch Current Weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unitSystem}`
      );
      const currentData = await currentRes.json();

      if (currentData.cod !== 200) {
        Alert.alert('Error', currentData.message || 'City not found');
        setLoading(false);
        return;
      }

      // Fetch Forecast (5 day / 3 hour)
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unitSystem}`
      );
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
        windSpeed: `${currentData.wind.speed} ${unitSystem === 'metric' ? 'm/s' : 'mph'}`,
        windDir: getWindDirection(currentData.wind.deg),
        aqi: index,
        aqiDesc: label,
      });

      setSearchQuery(currentData.name);
      setIsSearching(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  // Simplified US AQI Calculation based on PM2.5 (standard primary pollutant)
  const calculateUS_AQI = (pm25: number) => {
    // Breakpoints for PM2.5
    // 0-12.0 -> 0-50
    // 12.1-35.4 -> 51-100
    // 35.5-55.4 -> 101-150
    // 55.5-150.4 -> 151-200
    // 150.5-250.4 -> 201-300
    // 250.5+ -> 301-500

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
      aqi = linear(500, 301, 500.4, 250.5, pm25); // Cap at 500 mostly
      label = 'Hazardous';
    }

    return { index: Math.round(aqi), label };
  };

  const linear = (Ihi: number, Ilo: number, BPhi: number, BPlo: number, C: number) => {
    return ((Ihi - Ilo) / (BPhi - BPlo)) * (C - BPlo) + Ilo;
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

  const handleSearchSubmit = () => {
    fetchWeatherData(searchQuery, unit);
  };

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const DetailItem = ({ icon, label, value, subValue, color }: any) => (
    <View style={[styles.detailCard, { backgroundColor: color || '#f5f5f5' }]}>
      <View style={styles.detailHeader}>
        <Ionicons name={icon} size={20} color="#555" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View>
        <Text style={styles.detailValueMajor}>{value}</Text>
        {subValue && <Text style={styles.detailSubValue}>{subValue}</Text>}
      </View>
    </View>
  );

  const AQICard = ({ aqi, desc }: { aqi: number; desc: string }) => {
    // Calculate percentage for indicator (0-300 scale usually)
    const percentage = Math.max(0, Math.min(100, (aqi / 300) * 100));

    return (
      <View style={styles.aqiCard}>
        <View style={styles.aqiHeader}>
          <Ionicons name="filter-outline" size={20} color="#333" />
          <Text style={styles.aqiTitle}>Air quality</Text>
        </View>

        <Text style={styles.aqiCurrentLabel}>Current condition</Text>
        <View style={styles.aqiValueContainer}>
          <Text style={styles.aqiValueLarge}>{aqi}</Text>
          <Text style={styles.aqiStatusText}>{desc}</Text>
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

        <Text style={styles.aqiStatement}>{getAQIStatement(aqi)}</Text>
      </View>
    );
  };

  if (loading && !currentWeather) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Weather Card Section */}
          <View style={styles.weatherCard}>
            <Image source={weatherBg} style={styles.cardBgImage} resizeMode="cover" />

            <View style={styles.cardContent}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setSettingsVisible(true)}>
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>

                {isSearching ? (
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={handleSearchSubmit}
                      placeholder="Enter City"
                      placeholderTextColor="#ccc"
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSearchSubmit}>
                      <Ionicons name="search" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.locationPill}
                    onPress={() => {
                      setSearchQuery('');
                      setIsSearching(true);
                    }}>
                    <Text style={styles.locationText}>{currentWeather?.name || 'Search'}</Text>
                    <Ionicons
                      name="search-outline"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => fetchWeatherData(currentWeather?.name, unit)}>
                  <Ionicons name="refresh-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Main Weather Info */}
              <View style={styles.mainInfo}>
                <View style={styles.tempContainer}>
                  <Text style={styles.tempText}>
                    {Math.round(currentWeather?.main?.temp || 0)}°
                  </Text>
                  {currentWeather?.weather?.[0]?.icon && (
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`,
                      }}
                      style={{ width: 80, height: 80, marginLeft: 10 }}
                    />
                  )}
                </View>
                <Text style={styles.conditionText}>
                  {currentWeather?.weather?.[0]?.description
                    ? currentWeather.weather[0].description.charAt(0).toUpperCase() +
                      currentWeather.weather[0].description.slice(1)
                    : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.dragHandle} />

            {/* Hourly Section */}
            <Text style={styles.sectionTitleBlack}>Hourly Forecast</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyList}>
              {hourlyData.map((item, index) => (
                <View key={index} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTimeBlack}>{item.time}</Text>
                  <Ionicons
                    name={item.icon as any}
                    size={28}
                    color={item.isSunny ? '#fdb813' : '#54a0ff'}
                    style={styles.hourlyIcon}
                  />
                  <Text style={styles.hourlyTempBlack}>{item.temp}°</Text>
                </View>
              ))}
            </ScrollView>

            {/* AQI Card Section */}
            {detailsData.aqi !== undefined && (
              <AQICard aqi={detailsData.aqi} desc={detailsData.aqiDesc} />
            )}

            {/* Daily Section */}
            <Text style={[styles.sectionTitleBlack, { marginTop: 25 }]}>Daily Forecast</Text>
            <View style={styles.dailyList}>
              {dailyData.map((item, index) => (
                <View key={index} style={styles.dailyItem}>
                  <Text style={styles.dailyDay}>{item.day}</Text>
                  <View style={styles.dailyConditionContainer}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.icon === 'sunny' ? '#fdb813' : '#54a0ff'}
                    />
                    <Text style={styles.dailyCondition}>{item.condition}</Text>
                  </View>
                  <View style={styles.dailyTemps}>
                    <Text style={styles.tempHigh}>{item.high}°</Text>
                    <Text style={styles.tempLow}>{item.low}°</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Details Section */}
            <Text style={[styles.sectionTitleBlack, { marginTop: 25 }]}>Current Details</Text>
            <View style={styles.detailsGrid}>
              <DetailItem
                icon="thermometer-outline"
                label="Feels Like"
                value={detailsData.feelsLike}
                color="#E3F2FD"
              />
              <DetailItem
                icon="water-outline"
                label="Humidity"
                value={detailsData.humidity}
                color="#E0F7FA"
              />
              <DetailItem
                icon="speedometer-outline"
                label="Pressure"
                value={detailsData.pressure}
                color="#F3E5F5"
              />
              <DetailItem
                icon="eye-outline"
                label="Visibility"
                value={detailsData.visibility}
                color="#E8F5E9"
              />
              <DetailItem
                icon="navigate-outline"
                label="Wind"
                value={detailsData.windSpeed}
                subValue={detailsData.windDir}
                color="#FFF3E0"
              />
              <DetailItem
                icon="sunny-outline"
                label="Sunset"
                value={detailsData.sunset}
                subValue={`Sunrise: ${detailsData.sunrise}`}
                color="#FFF8E1"
              />
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={settingsVisible}
          onRequestClose={() => setSettingsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Temperature Unit</Text>
                  <Text style={styles.settingSubLabel}>
                    Current: {unit === 'metric' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={unit === 'imperial' ? '#2196f3' : '#f4f3f4'}
                  onValueChange={toggleUnit}
                  value={unit === 'imperial'}
                />
              </View>

              <Text style={styles.modalFooter}>Weather data provided by OpenWeatherMap</Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempText: {
    fontSize: 84,
    fontWeight: 'bold',
    color: '#fff',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  conditionText: {
    fontSize: 24,
    color: '#fff',
    fontStyle: 'italic',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    marginTop: -5,
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
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  detailCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  detailValueMajor: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  detailSubValue: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
