import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Overview from '../screens/overview';
import Details from '../screens/details';
import { BackButton } from '../components/BackButton';
import BottomNavigator from './BottomNavigator';
import FullscreenChart from '../screens/FullscreenChart';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RegisterScreen from '../screens/RegisterScreen'; // Make sure this exists
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export type RootStackParamList = {
  Overview: undefined;
  Details: { name: string };
  BottomNavigation: { name: string };
  FullscreenChart: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  HomeScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user, loading } = useAuth();

  console.log('RootStack user:', user);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="BottomNavigation" component={BottomNavigator} />
            <Stack.Screen name="Overview" component={Overview} />
            <Stack.Screen
              name="Details"
              component={Details}
              options={({ navigation }) => ({
                headerLeft: () => <BackButton onPress={navigation.goBack} />,
              })}
            />
            <Stack.Screen name="FullscreenChart" component={FullscreenChart} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
