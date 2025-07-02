import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { animations } from '../constants/animations/animations';

export default function Donut() {
  const webviewRef = useRef(null);

  const chartConfig = {
    type: 'doughnut2d', // 🔁 Donut chart type
    width: '100%',
    height: '100%',
    dataFormat: 'json',
    dataSource: {
      chart: {
        animations: true,
        caption: 'Mobile OS Market Share',
        subCaption: '2024 (Q1)',
        numberSuffix: '%',
        showPercentValues: 1,
        theme: 'fusion',
        defaultCenterLabel: 'OS Share',
        centerLabel: '$label: $value%',
        showLegend: 1,
        legendPosition: 'bottom',
        doughnutRadius: '75%', // 👈 Increase radius here
        pieRadius: '50%',
      },
      data: [
        { label: 'Android', value: '72.2' },
        { label: 'iOS', value: '26.9' },
        { label: 'KaiOS', value: '0.4' },
        { label: 'Others', value: '0.5' },
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
