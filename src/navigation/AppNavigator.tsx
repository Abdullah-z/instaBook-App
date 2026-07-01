// src/navigation/AppNavigator.tsx

import React, { useContext, useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import StoryViewer from '../components/StoryViewer';
import CreatePostScreen from '../screens/CreatePostScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import EventsScreen from '../screens/EventsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EditEventScreen from '../screens/EditEventScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import NearbyChatScreen from '../screens/NearbyChatScreen';

import { AuthContext } from '../auth/AuthContext';
import PageScreen from '../screens/PageScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { Button, useTheme } from 'react-native-paper';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import CommentsScreen from '../screens/CommentScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditPostScreen from '../screens/EditPostScreen';
import PostScreen from '../screens/PostScreen';
import NotificationToast from '../components/NotificationToast';
import useSocketStore from '../store/useSocketStore';
import HeaderLogo from '../components/HeaderLogo';
import HeaderRightActions from '../components/HeaderRightActions';
import DiscoverScreen from '../screens/DiscoverScreen';
import MapScreen from '../screens/MapScreen';
import UserPostMapScreen from '../screens/UserPostMapScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InterestsScreen from '../screens/InterestsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { token, user, userType, logout, loading, showOnboarding } = useContext(AuthContext);
  const { notification, showNotification, setShowNotification } = useSocketStore();
  const theme = useTheme();

  if (loading || showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  return (
    <>
      <Stack.Navigator
        detachInactiveScreens={false}
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        {showOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (token || user) ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{
                title: '',
                headerShown: true,
                headerLeft: () => <HeaderLogo />,
                headerRight: () => <HeaderRightActions />,
              }}
            />
            {/* ... rest of authenticated screens ... */}
            <Stack.Screen name="CommentsScreen" component={CommentsScreen as any} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="EditPost"
              component={EditPostScreen}
              options={{ title: 'Edit Post' }}
            />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
            />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: true }} />
            <Stack.Screen
              name="PostDetail"
              component={PostScreen}
              options={{ headerShown: true, headerTitle: '' }}
            />
            <Stack.Screen
              name="Marketplace"
              component={MarketplaceScreen}
              options={{ title: 'Marketplace' }}
            />
            <Stack.Screen
              name="CreateListing"
              component={CreateListingScreen}
              options={{ title: 'Create Listing' }}
            />
            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
              options={{ title: 'Listing Details' }}
            />
            <Stack.Screen
              name="MyListings"
              component={MyListingsScreen}
              options={{ title: 'Your Listings' }}
            />
            <Stack.Screen
              name="Discover"
              component={DiscoverScreen}
              options={{ title: 'Discover' }}
            />
            <Stack.Screen
              name="Map"
              component={MapScreen}
              options={{ title: 'Map', headerShown: false }}
            />
            <Stack.Screen
              name="UserPostMap"
              component={UserPostMapScreen}
              options={{ title: 'Post History', headerShown: false }}
            />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewer}
              options={{
                presentation: 'modal',
                headerShown: false,
                cardStyle: { backgroundColor: 'black' },
              }}
            />
            <Stack.Screen
              name="CreatePostScreen"
              component={CreatePostScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="CreateGroupScreen"
              component={CreateGroupScreen}
              options={{ title: 'Create Group', headerShown: false }}
            />
            <Stack.Screen
              name="GroupDetailsScreen"
              component={GroupDetailsScreen}
              options={{ title: 'Group Details' }}
            />
            <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{ title: 'Create Event' }}
            />
            <Stack.Screen
              name="EventDetail"
              component={EventDetailScreen}
              options={{ title: 'Event' }}
            />
            <Stack.Screen
              name="EditEvent"
              component={EditEventScreen}
              options={{ title: 'Edit Event' }}
            />
            <Stack.Screen
              name="MyEvents"
              component={MyEventsScreen}
              options={{ title: 'My Events' }}
            />
            <Stack.Screen
              name="FollowRequests"
              component={require('../screens/FollowRequestsScreen').default}
              options={{ title: 'Follow Requests', headerShown: true }}
            />
            <Stack.Screen
              name="NearbyChat"
              component={NearbyChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Interests"
              component={InterestsScreen}
              options={{ title: 'Feed Interests' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: true, headerTitle: '', headerLeft: () => <HeaderLogo /> }}
            />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      {showNotification && (
        <NotificationToast
          visible={showNotification}
          message={notification}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    backgroundColor: '#D4F637', // Lime green
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoP: { fontWeight: 'bold', fontSize: 18 },
  logoText: { fontWeight: 'bold', fontSize: 20 },
  skipText: { color: '#666', fontSize: 16 },

  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'flex-end', paddingBottom: 40 },

  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    position: 'absolute',
    top: 50,
  },
  circle2: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 150,
    right: 20,
  },
  circle3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d0d0d0',
    position: 'absolute',
    top: 200,
    left: 40,
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: { gap: 16 },
  getStartedButton: {
    backgroundColor: '#D4F637', // Lime green
    borderRadius: 30,
  },
  loginOutlineButton: {
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 30,
  },

  // Form Styles
  backButton: { fontSize: 24, padding: 10 },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 32 },
  input: { marginBottom: 16, backgroundColor: '#fff' },
  error: { color: 'red', marginBottom: 16 },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    marginTop: 10,
  },
});
