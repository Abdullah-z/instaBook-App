import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';
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
    title: 'Welcome to instaBook',
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
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleFinish = async () => {
    await completeOnboarding();
  };

  const renderItem = ({ item, index }: { item: (typeof ONBOARDING_DATA)[0]; index: number }) => (
    <View style={styles.slide}>
      <LinearGradient colors={item.colors as any} style={styles.iconContainer}>
        <Ionicons name={item.icon as any} size={100} color="#fff" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIndex === index ? '#D4F637' : '#eee',
                  width: activeIndex === index ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={activeIndex === ONBOARDING_DATA.length - 1 ? handleFinish : () => {}}>
          <Text style={styles.buttonText}>
            {activeIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Swipe to Explore'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: '#000',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
