import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PerformanceChart() {
  const webviewRef = useRef(null);

  const chartConfig = {
    type: 'spline',
    width: '100%',
    height: '100%',
    dataFormat: 'json',
    dataSource: {
      chart: {
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
