import { View, Text } from 'react-native';

import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

export default function WorldMap() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'world',
    width: '100%',
    height: 400,
    dataFormat: 'json',
    dataSource: {
      chart: {
        showlegend: 0,
        caption: 'Co-working Locations of WeWork in Different Countries',
        nullentityfillcolor: '#757DE8',
        showmarkerlabels: '0',
        showentitytooltip: '0',
        showentityhovereffect: '0',
        theme: 'fusion',
      },
      markers: {
        items: [
          {
            id: 'lon',
            shapeid: 'we-anchor',
            x: '190.23',
            y: '350.9',
            label: 'Chile',
            value: '1',
            tooltext: 'In Chile, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'atl',
            shapeid: 'we-anchor',
            x: '130.14',
            y: '140.9',
            label: 'USA',
            value: '32',
            tooltext: 'In USA, WeWork has <b>$value</b> co-working locations</b>',
            labelpos: 'left',
          },
          {
            id: 'ind',
            shapeid: 'we-anchor',
            x: '500.14',
            y: '203.9',
            label: 'India',
            value: '6',
            tooltext: 'In India, WeWork has <b>$value</b> co-working locations',
            labelpos: 'bottom',
          },
          {
            id: 'Aus',
            shapeid: 'we-anchor',
            x: '628.14',
            y: '305.9',
            label: 'Australia',
            value: '4',
            tooltext: 'In Australia, WeWork has <b>$value</b> co-working locations',
          },
          {
            id: 'china',
            shapeid: 'we-anchor',
            x: '573.14',
            y: '161.9',
            label: 'China',
            value: '12',
            tooltext: 'In China, WeWork has <b>$value</b> co-working locations',
          },
          {
            id: 'Thi',
            shapeid: 'we-anchor',
            x: '553.14',
            y: '211.9',
            label: 'Thailand',
            value: '1',
            tooltext: 'In Thailand, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'Sing',
            shapeid: 'we-anchor',
            x: '560.14',
            y: '231.9',
            label: 'Singapore',
            value: '1',
            tooltext: 'In Singapore, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'Indo',
            shapeid: 'we-anchor',
            x: '570.14',
            y: '250.9',
            label: 'Indonesia',
            value: '1',
            tooltext: 'In Indonesia, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'sKorea',
            shapeid: 'we-anchor',
            x: '603.14',
            y: '155.9',
            label: 'South Korea',
            value: '2',
            tooltext: 'In South Korea, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'jap',
            shapeid: 'we-anchor',
            x: '633.14',
            y: '145.9',
            label: 'Japan',
            value: '7',
            tooltext: 'In Japan, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'isrl',
            shapeid: 'we-anchor',
            x: '445.14',
            y: '165.9',
            label: 'Isreal',
            value: '5',
            tooltext: 'In Israel, WeWork has <b>$value</b> co-working locations',
          },
          {
            id: 'ire',
            shapeid: 'we-anchor',
            x: '325.14',
            y: '105.9',
            label: 'Ireland',
            value: '1',
            tooltext: 'In Ireland, WeWork has <b>$value</b> co-working location',
            labelpos: 'left',
          },
          {
            id: 'pol',
            shapeid: 'we-anchor',
            x: '365.14',
            y: '118.9',
            label: 'Poland',
            value: '1',
            tooltext: 'In Poland, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'spain',
            shapeid: 'we-anchor',
            x: '330.14',
            y: '145.9',
            label: 'Spain',
            value: '2',
            tooltext: 'In Spain, WeWork has <b>$value</b> co-working locations',
          },
          {
            id: 'Mexico',
            shapeid: 'we-anchor',
            x: '130.14',
            y: '190.9',
            label: 'Mexico',
            value: '3',
            tooltext: 'In Mexico, WeWork has <b>$value</b> co-working location',
          },
          {
            id: 'Brazil',
            shapeid: 'we-anchor',
            x: '250.14',
            y: '260.9',
            label: 'Brazil',
            value: '4',
            tooltext: 'In Brazil, WeWork has <b>$value</b> co-working locations',
          },
        ],
        shapes: [
          {
            id: 'we-anchor',
            type: 'image',
            url: 'https://cdn3.iconfinder.com/data/icons/iconic-1/32/map_pin_fill-512.png',
            xscale: '4',
            yscale: '4',
          },
        ],
      },
    },
  };
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
<!-- Core FusionCharts library -->
<script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>

<!-- FusionMaps module -->
<script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.maps.js"></script>

<!-- World map definition -->
<script src="https://cdn.fusioncharts.com/fusioncharts/latest/maps/fusioncharts.world.js"></script>

<!-- Theme (optional but recommended) -->
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
