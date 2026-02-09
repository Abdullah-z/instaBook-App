import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../auth/AuthContext';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA: {
  title: string;
  description: string;
  icon: string;
  colors: readonly [string, string, ...string[]];
}[] = [
  {
    title: 'Welcome to Circles',
    description: 'Your all-in-one social powerhouse for connecting and sharing.',
    icon: 'apps',
    colors: ['#D4F637', '#B8D430'],
  },
  {
    title: 'Social & Content',
    description: 'Share your life with Posts, Stories, Reels, and engaging Comments.',
    icon: 'share-social',
    colors: ['#4facfe', '#00f2fe'],
  },
  {
    title: 'Stay Connected',
    description: 'Real-time Chat, crystal clear Voice & Video calls, and smart Notifications.',
    icon: 'videocam',
    colors: ['#667eea', '#764ba2'],
  },
  {
    title: 'Meet Capricon AI',
    description: 'Your powerful smart assistant for Image Gen, Search, & Smart Reminders.',
    icon: 'sparkles',
    colors: ['#ff9a9e', '#fecfef'],
  },
  {
    title: 'Utilities & Maps',
    description: 'Check real-time Weather, latest News, and find your way with interactive Maps.',
    icon: 'map',
    colors: ['#a1c4fd', '#c2e9fb'],
  },
  {
    title: 'Marketplace',
    description: 'Explore unique items and find the best local deals at your fingertips.',
    icon: 'cart',
    colors: ['#f093fb', '#f5576c'],
  },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useContext(AuthContext);
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleFinish = async () => {
    await completeOnboarding();
  };

  const renderItem = ({ item }: { item: (typeof ONBOARDING_DATA)[0]; index: number }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}>
        <Ionicons name={item.icon as any} size={84} color="#fff" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.carouselWrapper}>
        <Carousel
          loop={false}
          width={width}
          height={height * 0.7}
          autoPlay={false}
          data={ONBOARDING_DATA}
          scrollAnimationDuration={500}
          onSnapToItem={(index) => setActiveIndex(index)}
          renderItem={renderItem}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    activeIndex === index ? theme.colors.primary : theme.colors.outlineVariant,
                  width: activeIndex === index ? 24 : 8,
                  opacity: activeIndex === index ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={activeIndex === ONBOARDING_DATA.length - 1 ? handleFinish : () => {}}>
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {activeIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Swipe to Explore'}
          </Text>
          {activeIndex === ONBOARDING_DATA.length - 1 ? (
            <Ionicons
              name="arrow-forward"
              size={20}
              color={theme.colors.onPrimary}
              style={{ marginLeft: 8 }}
            />
          ) : null}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -1,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '900',
  },
});
