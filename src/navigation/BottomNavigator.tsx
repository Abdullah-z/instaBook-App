import * as React from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import Overview from '../screens/overview';
import Albums from '../screens/Albums';
import Chart from '../components/Chart';
import Donut from '../components/Donut';
import Radar from '../components/Radar';
import PerformanceChart from '../components/PerformanceChart';
import HeatmapChart from '../components/HeatmapChart';
import { ScrollView } from 'react-native-gesture-handler';
import TreeMap from '../components/TreeMap';
import Notifications from '../screens/Notifications';
import Recents from '../screens/Recents';

const AlbumsRoute = () => <Albums />;

const RecentsRoute = () => <Recents />;

const NotificationsRoute = () => <Notifications />;

const BottomNavigator = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'music', title: 'Favorites', focusedIcon: 'heart', unfocusedIcon: 'heart-outline' },
    { key: 'albums', title: 'Albums', focusedIcon: 'album' },
    { key: 'recents', title: 'Recents', focusedIcon: 'history' },
    {
      key: 'notifications',
      title: 'Notifications',
      focusedIcon: 'bell',
      unfocusedIcon: 'bell-outline',
    },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    music: Overview,
    albums: AlbumsRoute,
    recents: RecentsRoute,
    notifications: NotificationsRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default BottomNavigator;
