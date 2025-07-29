import React, { useEffect } from 'react';
import { View, Button } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import StocksChart from '../components/StocksChart';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';

export default function FullscreenChart() {
  const navigation = useNavigation();
  useEffect(() => {
    // Lock to landscape on mount
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      // Unlock orientation on unmount (back to default)
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <ScrollView>
      <View style={{ flex: 1 }}>
        <StocksChart style={{ flex: 1, width: '100%', height: '100%' }} />
        <Button title="Close" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
}
