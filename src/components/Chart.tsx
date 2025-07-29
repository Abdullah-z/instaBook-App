import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Chart() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  const chartConfig = {
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
        <script src="https://cdn.fusioncharts.com/fusioncharts/latest/themes/fusioncharts.theme.fusion.js"></script>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: transparent;
          }
          #chart-container {
            height: 600px; /* ✅ Matches View and FusionChart height */
            width: 100%;
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

          window.addEventListener('message', function (e) {
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
        nestedScrollEnabled={false} // ✅ prevents scroll glitches inside ScrollView
        overScrollMode="never"
        setSupportZoom={false}
        onLoadEnd={() => {
          setWebViewLoaded(true);
          setTimeout(sendChartConfig, 100);
        }}
      />
    </View>
  );
}
