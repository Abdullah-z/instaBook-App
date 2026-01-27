import React, { useContext, useMemo } from 'react';
import { BottomNavigation, Avatar, useTheme } from 'react-native-paper';
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

  const [index, setIndex] = React.useState(0);

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

  const handleIndexChange = (newIndex: number) => {
    if (newIndex === 2) {
      // Create tab pressed
      setIndex(newIndex);
    } else {
      setIndex(newIndex);
    }
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
