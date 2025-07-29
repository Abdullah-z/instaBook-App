import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Fusion({ chartConfig }) {
  const webviewRef = useRef(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          function renderChart(config) {
            new FusionCharts({ ...config, renderAt: 'chart-container' }).render();
          }
          document.addEventListener('message', function (e) {
            try {
              const { chartConfig } = JSON.parse(e.data);
              renderChart(chartConfig);
            } catch (err) {
              document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
            }
          });
          // For Android
          window.addEventListener('message', function (e) {
            try {
              const { chartConfig } = JSON.parse(e.data);
              renderChart(chartConfig);
            } catch (err) {
              document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
            }
          });
        </script>
      </body>
    </html>
  `;

  // 🔁 Re-send config every time chartConfig changes
  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({ chartConfig }));
    }
  }, [chartConfig]);

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
          setTimeout(() => {
            if (webviewRef.current) {
              webviewRef.current.postMessage(JSON.stringify({ chartConfig }));
            }
          }, 100);
        }}
      />
    </View>
  );
}
