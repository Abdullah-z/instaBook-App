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
import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import StoryViewer from '../components/StoryViewer';
import CreatePostScreen from '../screens/CreatePostScreen';

export type RootStackParamList = {
  Overview: undefined;
  Details: { name: string };
  BottomNavigation: { name: string };
  FullscreenChart: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  HomeScreen: undefined;
  StoryViewer: { userStories: any };
  CreatePostScreen: { initialPostType: 'feed' | 'story' | 'both' };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user, loading } = useContext(AuthContext);

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
              options={{ presentation: 'modal' }}
            />
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
