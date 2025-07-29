import React from 'react';
import { Text, Image, View, FlatList } from 'react-native';
import Donut from '../components/Donut';
import HeatmapChart from '../components/HeatmapChart';
import SparklineDots from '../components/SparklineDots';
import Gantt from '../components/Gantt';
import Sunburst from '../components/Sunburst';

const listItems = [
  { key: 'chart1', type: 'chart', component: Donut },
  { key: 'chart2', type: 'chart', component: HeatmapChart },
  { key: 'chart3', type: 'chart', component: SparklineDots },
  { key: 'chart4', type: 'chart', component: Sunburst },
];

export default function Notifications() {
  return (
    <FlatList
      data={listItems}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        if (item.type === 'chart') {
          const ChartComponent = item.component;
          if (!ChartComponent) return null; // <-- guard against undefined

          // Tell TS this is a React component (function component or class)
          return (
            <View style={{ marginBottom: 24 }}>
              <ChartComponent />
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
