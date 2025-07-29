import React, { useRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HeatmapChart() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'heatmap',
    width: '100%',
    height: '100%',
    dataFormat: 'json',
    dataSource: {
      chart: {
        theme: 'fusion',
        caption: 'Score card by subject',
        subcaption: 'Bell Curve Grading',
        xaxisname: 'Subject',
        yaxisname: 'Student',
        showvalues: '1',
        valuefontcolor: '#ffffff',
        plottooltext: "$rowlabel's score in $columnlabel : <b>$value</b>/5",
      },
      colorrange: {
        gradient: '1',
        minvalue: '0',
        mapbypercent: '1',
        startlabel: 'Poor',
        endlabel: 'Outstanding',
      },
      dataset: [
        {
          data: [
            {
              rowid: 'JA',
              columnid: 'EN',
              value: '3.7',
            },
            {
              rowid: 'JA',
              columnid: 'PY',
              value: '4.3',
            },
            {
              rowid: 'JA',
              columnid: 'MT',
              value: '4.0',
            },
            {
              rowid: 'JA',
              columnid: 'HS',
              value: '3.3',
            },
            {
              rowid: 'JA',
              columnid: 'EC',
              value: '3.1',
            },
            {
              rowid: 'EM',
              columnid: 'EN',
              value: '3.6',
            },
            {
              rowid: 'EM',
              columnid: 'PY',
              value: '4.0',
            },
            {
              rowid: 'EM',
              columnid: 'MT',
              value: '3.2',
            },
            {
              rowid: 'EM',
              columnid: 'HS',
              value: '2.6',
            },
            {
              rowid: 'EM',
              columnid: 'EC',
              value: '3.2',
            },
            {
              rowid: 'JY',
              columnid: 'EN',
              value: '3.8',
            },
            {
              rowid: 'JY',
              columnid: 'PY',
              value: '4.1',
            },
            {
              rowid: 'JY',
              columnid: 'MT',
              value: '3.9',
            },
            {
              rowid: 'JY',
              columnid: 'HS',
              value: '2.6',
            },
            {
              rowid: 'JY',
              columnid: 'EC',
              value: '2',
            },
            {
              rowid: 'WL',
              columnid: 'EN',
              value: '3.4',
            },
            {
              rowid: 'WL',
              columnid: 'PY',
              value: '3.2',
            },
            {
              rowid: 'WL',
              columnid: 'MT',
              value: '4',
            },
            {
              rowid: 'WL',
              columnid: 'HS',
              value: '2.5',
            },
            {
              rowid: 'WL',
              columnid: 'EC',
              value: '3.1',
            },
          ],
        },
      ],
      columns: {
        column: [
          {
            id: 'EN',
            label: 'English',
          },
          {
            id: 'MT',
            label: 'Maths',
          },
          {
            id: 'PY',
            label: 'Physics',
          },
          {
            id: 'HS',
            label: 'History',
          },
          {
            id: 'EC',
            label: 'Economics',
          },
        ],
      },
      rows: {
        row: [
          {
            id: 'JA',
            label: 'Jacob',
          },
          {
            id: 'EM',
            label: 'Emma',
          },
          {
            id: 'JY',
            label: 'Jayden',
          },
          {
            id: 'WL',
            label: 'William',
          },
        ],
      },
    },
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
    <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.powercharts.js"></script>
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
      let chartData = null;
      let fusionChartsLoaded = false;

      console.log("WebView: Script started.");

      // IMPORTANT: Listen for messages as early as possible
      document.addEventListener('message', function (event) {
        console.log("WebView: Message received from RN:", event.data);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
             window.ReactNativeWebView.postMessage("WebView: Received message from RN. Data: " + event.data.substring(0, 100) + "...");
        }

        try {
          const message = JSON.parse(event.data);
          if (message.chartConfig) {
            chartData = message.chartConfig;
            console.log("WebView: chartConfig parsed and received.");
            renderChart();
          } else {
            console.log("WebView: Message received but no chartConfig property:", message);
            document.getElementById('chart-container').innerText = 'Message received, but chartConfig missing.';
          }
        } catch (err) {
          console.error("WebView: Message Parse Error:", err, "Raw data:", event.data);
          document.getElementById('chart-container').innerText = 'Message Parse Error: ' + err.message + '. Raw: ' + event.data.substring(0, 50) + '...';
        }
      });

      function renderChart() {
        if (chartData && fusionChartsLoaded) {
          console.log("WebView: Attempting to render chart.");
          try {
            FusionCharts.ready(function () {
              new FusionCharts({
                ...chartData,
                renderAt: 'chart-container'
              }).render();
              console.log("WebView: Chart rendered successfully!");
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage("WebView: Chart rendered successfully.");
              }
            });
          } catch (err) {
            console.error("WebView: FusionCharts Render Error:", err);
            document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage("WebView: Chart render error: " + err.message);
            }
          }
        } else {
          console.log("WebView: Cannot render yet. chartData:", !!chartData, "fusionChartsLoaded:", fusionChartsLoaded);
          if (!chartData) {
            document.getElementById('chart-container').innerText = 'No chart data received.';
          } else if (!fusionChartsLoaded) {
            document.getElementById('chart-container').innerText = 'FusionCharts library not loaded yet.';
          }
        }
      }

      // Check if FusionCharts is already loaded, or wait for it
      if (window.FusionCharts) {
          fusionChartsLoaded = true;
          console.log("WebView: FusionCharts already loaded.");
          renderChart();
      } else {
          console.log("WebView: FusionCharts not yet loaded, polling.");
          const checkFusionChartsInterval = setInterval(() => {
            if (window.FusionCharts) {
              clearInterval(checkFusionChartsInterval);
              fusionChartsLoaded = true;
              console.log("WebView: FusionCharts loaded via poll.");
              renderChart();
            }
          }, 100);
      }

      // Fallback if message isn't received for a long time
      setTimeout(() => {
        if (!chartData) {
          document.getElementById('chart-container').innerText = 'Still no chart data after 10 seconds. Check React Native postMessage.';
          console.warn("WebView: No chart data received after 10 seconds.");
        }
      }, 10000);
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
        // onMessage is crucial for receiving messages from WebView
        onMessage={(event) => {
          // You can handle messages from the WebView here if needed
          // For example, if the chart emits events
          console.log('Message from WebView:', event.nativeEvent.data);
        }}
        onLoadEnd={() => {
          setWebViewLoaded(true); // optional
          setTimeout(sendChartConfig, 100); // critical timing fix
        }}
      />
    </View>
  );
}
