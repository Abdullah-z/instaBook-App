import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { animations } from '../constants/animations/animations';

export default function Chart() {
  const webviewRef = useRef(null);

  const chartConfig = {
    type: 'column2d',
    width: '100%',
    height: '100%',
    dataFormat: 'json',
    dataSource: {
      chart: {
        animations: true,
        caption: 'Countries With Most Oil Reserves (2024)',
        xAxisName: 'Country',
        yAxisName: 'Reserves (Bn bbl)',
        theme: 'fusion',
      },
      data: [
        { label: 'Venezuela', value: '304' },
        { label: 'Saudi Arabia', value: '298' },
        { label: 'Iran', value: '208' },
        { label: 'Canada', value: '170' },
        { label: 'Iraq', value: '145' },
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
