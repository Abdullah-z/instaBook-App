import React from 'react';
import { Text, Image, View, FlatList } from 'react-native';
import Radar from '../components/Radar';
import PerformanceChart from '../components/PerformanceChart';
import TreeMap from '../components/TreeMap';
import Fusion from '../components/Fusion';
import { useTheme } from 'react-native-paper';
import rgbToHex from '../components/rgbToHex';

export default function Notifications() {
  const { colors } = useTheme();

  console.log(colors.primary);

  const listItems = [
    {
      key: 'chart1',
      type: 'chart',
      component: Fusion,
      props: {
        chartConfig: {
          type: 'spline',
          width: '100%',
          height: '100%',
          dataFormat: 'json',
          dataSource: {
            chart: {
              bgColor: rgbToHex(colors.surfaceVariant),
              canvasBgColor: rgbToHex(colors.surfaceVariant),
              lineColor: rgbToHex(colors.primary),
              anchorBgColor: rgbToHex(colors.primary),
              labelFontColor: rgbToHex(colors.onSurfaceVariant),
              yAxisValueFontColor: rgbToHex(colors.onSurfaceVariant),

              xAxisNameFontColor: rgbToHex(colors.secondary),
              yAxisNameFontColor: rgbToHex(colors.secondary),
              subCaptionFontColor: rgbToHex(colors.tertiary),

              captionFontColor: rgbToHex(colors.primary),

              drawAnchors: '1',
              anchorRadius: '5',
              canvasBgAlpha: '100',
              bgAlpha: '100',
              caption: 'Houses leased vs sold across US in 2023',
              subCaption: 'Click & drag on the plot area to zoom & then scroll',
              yaxisname: 'Number of houses',
              xaxisname: 'Date',
              labelStep: '2',
              forceaxislimits: '1',
              pixelsperpoint: '0',
              pixelsperlabel: '30',
              compactdatamode: '1',
              dataseparator: '|',
              theme: 'fusion',
              drawsmoothline: '1',
            },
            data: [
              {
                label: '2012',
                value: '89.45',
              },
              {
                label: '2013',
                value: '65.87',
              },
              {
                label: '2014',
                value: '45.64',
              },
              {
                label: '2015',
                value: '67.13',
              },
              {
                label: '2016',
                value: '45.67',
              },
              {
                label: '2017',
                value: '23.54',
              },
              {
                label: '2018',
                value: '76.75',
              },
              {
                label: '2019',
                value: '34.8',
              },
              {
                label: '2020',
                value: '56.16',
              },
              {
                label: '2021',
                value: '76.37',
              },
              {
                label: '2022',
                value: '23.66',
              },
              {
                label: '2023',
                value: '91.8',
              },
            ],
          },
        },
      },
    },

    { key: 'chart2', type: 'chart', component: Radar },

    { key: 'chart3', type: 'chart', component: TreeMap },

    {
      key: 'chart4',
      type: 'chart',
      component: Fusion,
      props: {
        chartConfig: {
          type: 'column2d',
          width: '100%',
          height: '600', // ✅ Fixed height for FusionCharts
          dataFormat: 'json',
          dataSource: {
            chart: {
              animations: true,
              caption: 'Countries With Most Oil Reserves (2024)',
              xAxisName: 'Country',
              yAxisName: 'Reserves (Bn bbl)',
              theme: 'fusion',
              canvasBgAlpha: '100',
              bgAlpha: '100',
              bgColor: rgbToHex(colors.surfaceVariant),
              canvasBgColor: rgbToHex(colors.surfaceVariant),
              paletteColors: rgbToHex(colors.primary),

              labelFontColor: rgbToHex(colors.onSurfaceVariant),
              yAxisValueFontColor: rgbToHex(colors.onSurfaceVariant),

              xAxisNameFontColor: rgbToHex(colors.secondary),
              yAxisNameFontColor: rgbToHex(colors.secondary),
              subCaptionFontColor: rgbToHex(colors.tertiary),

              captionFontColor: rgbToHex(colors.primary),
            },
            data: [
              { label: 'Venezuela', value: '304' },
              { label: 'Saudi Arabia', value: '298' },
              { label: 'Iran', value: '208' },
              { label: 'Canada', value: '170' },
              { label: 'Iraq', value: '145' },
            ],
          },
        },
      },
    },
  ];
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
              <ChartComponent {...(item.props || {})} />
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
