import { View, Text } from 'react-native';

import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

export default function SparklineDots() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'sparkline',
    width: '100%',
    height: 400,
    dataFormat: 'json',
    dataSource: {
      chart: {
        caption: 'Tesla Stock Price',
        subcaption: 'May 2018',
        numberprefix: '$',
        charttopmargin: '10',
        theme: 'gammel',
        showclosevalue: '1',
        showopenvalue: '1',
        setadaptiveymin: '1',
        drawanchors: '1',
        linealpha: '0',
        anchorsides: '4',
        anchorradius: '4',
        anchorcolor: '#ee8f49',
        showopenanchor: '1',
        showcloseanchor: '1',
        highcolor: '#ee8f49',
        lowcolor: '#ee8f49',
      },
      dataset: [
        {
          data: [
            {
              tooltext: '2-May: <b>$dataValue</b>',
              value: 246.3,
            },
            {
              tooltext: '3-May: <b>$dataValue</b>',
              value: 240.93,
            },
            {
              tooltext: '4-May: <b>$dataValue</b>',
              value: 240.41,
            },
            {
              tooltext: '7-May: <b>$dataValue</b>',
              value: 245.7,
            },
            {
              tooltext: '8-May: <b>$dataValue</b>',
              value: 252.91,
            },
            {
              tooltext: '9-May: <b>$dataValue</b>',
              value: 253.4,
            },
            {
              tooltext: '11-May: <b>$dataValue</b>',
              value: 252.49,
            },
            {
              tooltext: '14-May: <b>$dataValue</b>',
              value: 250.91,
            },
            {
              tooltext: '15-May: <b>$dataValue</b>',
              value: 249.11,
            },
            {
              tooltext: '16-May: <b>$dataValue</b>',
              value: 240.15,
            },
            {
              tooltext: '17-May: <b>$dataValue</b>',
              value: 244.76,
            },
            {
              tooltext: '18-May: <b>$dataValue</b>',
              value: 236.69,
            },
            {
              tooltext: '22-May: <b>$dataValue</b>',
              value: 234.55,
            },
            {
              tooltext: '23-May: <b>$dataValue</b>',
              value: 235.45,
            },
            {
              tooltext: '24-May: <b>$dataValue</b>',
              value: 238.02,
            },
            {
              tooltext: '25-May: <b>$dataValue</b>',
              value: 238.9,
            },
            {
              tooltext: '28-May: <b>$dataValue</b>',
              value: 239.9,
            },
            {
              tooltext: '29-May: <b>$dataValue</b>',
              value: 245.7,
            },
            {
              tooltext: '30-May: <b>$dataValue</b>',
              value: 246.3,
            },
          ],
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
    <View style={{ height: 400, width: '100%' }}>
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
