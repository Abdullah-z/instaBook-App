// src/navigation/AppNavigator.tsx

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import { AuthContext } from '../auth/AuthContext';
import PageScreen from '../screens/PageScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { Button } from 'react-native-paper';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import CommentsScreen from '../screens/CommentScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditPostScreen from '../screens/EditPostScreen';
import PostScreen from '../screens/PostScreen';
import NotificationToast from '../components/NotificationToast';
import { SocketContext } from '../auth/SocketContext';
import HeaderLogo from '../components/HeaderLogo';
import ProfileHeaderIcon from '../components/ProfileHeaderIcon';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, userType, logout, loading } = useContext(AuthContext);
  const { notification, showNotification, setShowNotification } = useContext(SocketContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Navigator>
        {token ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{
                title: '',

                headerShown: true,
                headerLeft: () => <HeaderLogo />,
                headerRight: () => <ProfileHeaderIcon />,
                headerLeftContainerStyle: {
                  paddingLeft: 0,
                },
              }}
            />

            <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
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
      {notification && (
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
