import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function SankeyChart() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'sankey',
    width: '100%',
    height: 600,
    dataFormat: 'json',
    dataSource: {
      chart: {
        caption: 'User Journey Flow',
        subcaption: 'From Landing to Conversion',
        theme: 'fusion',
        node: {
          showlabels: '1',
          hoverColor: '#ffb84d',
        },
        link: {
          color: '#cccccc',
          hoverColor: '#ffb84d',
        },
      },
      nodes: [
        { id: 'Landing' },
        { id: 'Signup' },
        { id: 'Browse' },
        { id: 'Cart' },
        { id: 'Checkout' },
        { id: 'Exit' },
      ],
      links: [
        { from: 'Landing', to: 'Signup', value: 500 },
        { from: 'Landing', to: 'Browse', value: 800 },
        { from: 'Signup', to: 'Browse', value: 300 },
        { from: 'Browse', to: 'Cart', value: 400 },
        { from: 'Cart', to: 'Checkout', value: 250 },
        { from: 'Cart', to: 'Exit', value: 150 },
        { from: 'Browse', to: 'Exit', value: 500 },
      ],
    },
  };

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.powercharts.js"></script>
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
          setWebViewLoaded(true); // optional
          setTimeout(sendChartConfig, 100); // critical timing fix
        }}
      />
    </View>
  );
}
