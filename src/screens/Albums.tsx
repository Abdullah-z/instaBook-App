import React from 'react';
import { Text, Image, View, FlatList, Button } from 'react-native';
import Chart from '../components/Chart';
import SankeyChart from '../components/SankeyChart';
import Guage from '../components/Guage';
import StocksChart from '../components/StocksChart';
import { useNavigation } from '@react-navigation/native';

const listItems = [
  { key: 'chart1', type: 'chart', component: Chart },
  { key: 'text1', type: 'text', content: 'Here is some info between charts' },
  { key: 'chart2', type: 'chart', component: SankeyChart },
  { key: 'image1', type: 'image', source: { uri: 'https://picsum.photos/200' } },
  { key: 'text2', type: 'text', content: 'Here is some END of line text' },

  { key: 'chart3', type: 'chart', component: Guage },
  {
    key: 'chart5',
    type: 'chart',
    component: StocksChart,
    showFullscreenButton: true, // <-- flag this one
  },
];

export default function Albums() {
  const navigation = useNavigation();
  return (
    <FlatList
      data={listItems}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        if (item.type === 'chart') {
          const ChartComponent = item.component;
          if (!ChartComponent) return null;

          return (
            <View style={{ marginBottom: 24 }}>
              <ChartComponent />
              {item.showFullscreenButton && (
                <Button
                  title="View Fullscreen"
                  onPress={() => navigation.navigate('FullscreenChart')}
                />
              )}
            </View>
          );
        } else if (item.type === 'text') {
          return (
            <View style={{ padding: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, textAlign: 'center' }}>{item.content}</Text>
            </View>
          );
        } else if (item.type === 'image') {
          return (
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Image
                source={item.source}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
          );
        }
        return null;
      }}
    />
  );
}
