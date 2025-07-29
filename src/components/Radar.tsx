import { View, Text } from 'react-native';

import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

export default function Radar() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

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
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
     
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/themes/fusioncharts.theme.fusion.js"></script>
      <style>
        html, body, #chart-container {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background-color: transparent;
        }
      </style>
    </head>
    <body>
      <div id="chart-container">Loading chart…</div>
      <script>
        document.addEventListener('message', function (e) {
          try {
            const { chartConfig } = JSON.parse(e.data);
            new FusionCharts({ ...chartConfig, renderAt: 'chart-container' }).render();
          } catch (err) {
            document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
          }
        });
      </script>
    </body>
  </html>
  `;

  const sendChartConfig = () => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({ chartConfig }));
    }
  };
  return (
    <View style={{ height: 600, width: '100%' }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{ html: htmlContent }}
        scrollEnabled={false}
        overScrollMode="never"
        setSupportZoom={false}
        onLoadEnd={() => {
          setWebViewLoaded(true); // optional
          setTimeout(sendChartConfig, 100); // critical timing fix
        }}
      />
    </View>
  );
}
