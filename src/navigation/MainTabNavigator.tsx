import React, { useContext, useMemo, useRef } from 'react';
import { BottomNavigation, Avatar, useTheme, TouchableRipple } from 'react-native-paper';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ReelsScreen from '../screens/ReelsScreen';
import WeatherNewsScreen from '../screens/WeatherNewsScreen';
import EventsScreen from '../screens/EventsScreen';
import { AuthContext } from '../auth/AuthContext';
import CreatePostBox from '../components/CreatePostBox';
import { useNavigation } from '@react-navigation/native';

const MainTabNavigator = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const routes = useMemo(
    () => [
      { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
      {
        key: 'messages',
        title: 'Messenger',
        focusedIcon: 'message',
        unfocusedIcon: 'message-outline',
      },
      {
        key: 'create',
        title: '',
        focusedIcon: 'plus-circle',
        unfocusedIcon: 'plus-circle-outline',
      },
      {
        key: 'reels',
        title: 'Reels',
        focusedIcon: 'play-box-multiple',
        unfocusedIcon: 'play-box-multiple-outline',
      },
      {
        key: 'weather',
        title: 'Updates',
        focusedIcon: 'newspaper-variant',
        unfocusedIcon: 'newspaper-variant-outline',
      },
    ],
    [user]
  );

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    messages: MessagesScreen,
    create: () => null,
    reels: ReelsScreen,
    profile: () => <ProfileScreen userId={user?._id} />,
    weather: WeatherNewsScreen,
  });

  const [index, setIndex] = React.useState(0);
  const lastTapRef = useRef(0);

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
  };

  const renderSceneWithCreate = ({ route, jumpTo }: any) => {
    if (route.key === 'create') {
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
          <CreatePostBox onPostCreated={() => setIndex(0)} />
        </View>
      );
    }
    return renderScene({ route, jumpTo });
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={handleIndexChange}
      renderScene={renderSceneWithCreate}
      renderTouchable={(props: any) => {
        const { route, onPress } = props;
        return (
          <TouchableRipple
            {...props}
            onPress={() => {
              if (route.key === 'home' && index === 0) {
                const now = Date.now();
                if (now - lastTapRef.current < 400) {
                  // Increased window to 400ms
                  console.log('📱 Home Double Tap Detected via Touchable');
                  const { DeviceEventEmitter } = require('react-native');
                  DeviceEventEmitter.emit('home_double_tap');
                }
                lastTapRef.current = now;
              }
              onPress();
            }}>
            {props.children}
          </TouchableRipple>
        );
      }}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
      }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      theme={{ colors: { secondaryContainer: theme.colors.secondaryContainer } }}
    />
  );
};

export default MainTabNavigator;
