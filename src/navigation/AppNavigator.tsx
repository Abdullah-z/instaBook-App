// src/navigation/AppNavigator.tsx

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

import { AuthContext } from '../auth/AuthContext';
import PageScreen from '../screens/PageScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { Button } from 'react-native-paper';
import { ActivityIndicator, View } from 'react-native';
import CommentsScreen from '../screens/CommentScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, userType, logout, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Home',
              headerRight: () => (
                <Button mode="text" onPress={logout}>
                  Logout
                </Button>
              ),
            }}
          />
          <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
