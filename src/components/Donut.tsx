import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Donut() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'doughnut2d',
    width: '100%',
    height: 600,
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
        doughnutRadius: '75%',
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
        nestedScrollEnabled={false}
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
