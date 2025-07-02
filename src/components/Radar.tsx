import { View, Text } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { animations } from '../constants/animations/animations';

export default function Radar() {
  const webviewRef = useRef(null);
  const chartConfig = {
    type: 'radar', // 🔁 This defines the radar chart type
    width: '100%',
    height: '100%',
    dataFormat: 'json',
    dataSource: {
      chart: {
        animations: true,
        caption: 'Skill Assessment - Developer',
        subCaption: 'Out of 100',
        theme: 'fusion',
        numberSuffix: ' pts',
        radarfillcolor: '#ffffff',
        plotfillalpha: '60',
        plottooltext: '<b>$dataValue</b> in $seriesName',
        showLegend: 1,
        legendPosition: 'bottom',
      },
      categories: [
        {
          category: [
            { label: 'React Native' },
            { label: 'Node.js' },
            { label: 'GraphQL' },
            { label: 'TypeScript' },
            { label: 'Firebase' },
          ],
        },
      ],
      dataset: [
        {
          seriesName: 'You',
          data: [{ value: 85 }, { value: 72 }, { value: 65 }, { value: 90 }, { value: 80 }],
        },
        {
          seriesName: 'Team Average',
          data: [{ value: 70 }, { value: 80 }, { value: 60 }, { value: 75 }, { value: 70 }],
        },
      ],
    },
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({ chartConfig }));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ height: 600, width: '100%' }}>
      <WebView
        ref={webviewRef}
        source={require('../../assets/fusioncharts.html')}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        scrollEnabled={false} // disables scrolling
        scalesPageToFit={false} // Android-only legacy zoom control
        androidHardwareAccelerationDisabled={false}
        overScrollMode="never" // avoids bouncing
        setSupportZoom={false}
        // Important: WebView should fill the container, not the screen
      />
    </View>
  );
}
