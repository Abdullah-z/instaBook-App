import { View, Text } from 'react-native';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Chart from '../components/Chart';
import Radar from '../components/Radar';

export default function Albums() {
  return (
    <ScrollView>
      <Chart></Chart>
    </ScrollView>
  );
}
