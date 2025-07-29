import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TreeMap() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = React.useState(false); // optional

  const chartConfig = {
    type: 'treemap',
    width: '100%',
    height: 600,
    dataFormat: 'json',
    dataSource: {
      chart: {
        caption: 'Region-wise Literacy Rates in 2015',
        subcaption: 'World Population',
        plottooltext:
          '<b>$label</b><br>Literacy Rate: <b>$svalue%</b><br>Population: <b>$datavalue</b>',
        legendcaption: 'Literacy Rate (%)',
        shownavigationbar: '1',
        formatnumberscale: '1',
        numberscaleunit: ', K, M, B',
        numberscalevalue: '1, 1000, 1000, 1000',
        forcenumberscale: '1',
        labelfontsize: '11',
        animation: '0',
        labelglow: '0',
        theme: 'fusion',
      },
      data: [
        {
          label: 'World',
          value: '6621397806',
          svalue: '86.3',
          data: [
            {
              label: 'Asia',
              value: '4084114938',
              svalue: '89.5',
              data: [
                {
                  label: 'South Asia',
                  value: '1635488712',
                  svalue: '69',
                  data: [
                    {
                      label: 'India',
                      value: '1205073612',
                      svalue: '72.1',
                    },
                    {
                      label: 'Sri Lanka',
                      value: '21481334',
                      svalue: '92.6',
                    },
                    {
                      label: 'Bhutan',
                      value: '716896',
                      svalue: '64.9',
                    },
                    {
                      label: 'Bangladesh',
                      value: '161083804',
                      svalue: '61.5',
                    },
                    {
                      label: 'Maldives',
                      value: '394451',
                      svalue: '99.3',
                    },
                    {
                      label: 'Afghanistan',
                      value: '26556800',
                      svalue: '38.2',
                    },
                    {
                      label: 'Pakistan',
                      value: '190291129',
                      svalue: '58.7',
                    },
                    {
                      label: 'Nepal',
                      value: '29890686',
                      svalue: '64.7',
                    },
                  ],
                },
                {
                  label: 'East Asia',
                  value: '1610979712',
                  svalue: '97.2',
                  data: [
                    {
                      label: 'China',
                      value: '1373000000',
                      svalue: '96.4',
                    },
                    {
                      label: 'Hong Kong',
                      value: '7298600',
                      svalue: '93.5',
                    },
                    {
                      label: 'Japan',
                      value: '126890000',
                      svalue: '96.7',
                    },
                    {
                      label: 'Macau',
                      value: '642900',
                      svalue: '96.2',
                    },
                    {
                      label: 'Mongolia',
                      value: '3041648',
                      svalue: '98.4',
                    },
                    {
                      label: 'North Korea',
                      value: '25155000',
                      svalue: '100',
                    },
                    {
                      label: 'South Korea',
                      value: '51482816',
                      svalue: '97.9',
                    },
                    {
                      label: 'Taiwan',
                      value: '23468748',
                      svalue: '98.5',
                    },
                  ],
                },
                {
                  label: 'Southeast Asia',
                  value: '621696000',
                  svalue: '89.7',
                  data: [
                    {
                      label: 'Brunei',
                      value: '453000',
                      svalue: '96.4',
                    },
                    {
                      label: 'Cambodia',
                      value: '15561000',
                      svalue: '77.2',
                    },
                    {
                      label: 'East Timor',
                      value: '1172000',
                      svalue: '67.5',
                    },
                    {
                      label: 'Indonesia',
                      value: '251490000',
                      svalue: '93.9',
                    },
                    {
                      label: 'Laos',
                      value: '6557000',
                      svalue: '79.9',
                    },
                    {
                      label: 'Malaysia',
                      value: '30034000',
                      svalue: '94.6',
                    },
                    {
                      label: 'Myanmar',
                      value: '51419000',
                      svalue: '93.1',
                    },
                    {
                      label: 'Philippines',
                      value: '101649000',
                      svalue: '96.3',
                    },
                    {
                      label: 'Singapore',
                      value: '5554000',
                      svalue: '96.8',
                    },
                    {
                      label: 'Thailand',
                      value: '65236000',
                      svalue: '96.7',
                    },
                    {
                      label: 'Vietnam',
                      value: '92571000',
                      svalue: '94.5',
                    },
                  ],
                },
                {
                  label: 'Western Asia',
                  value: '147963650',
                  svalue: '91.8',
                  data: [
                    {
                      label: 'Bahrain',
                      value: '1234596',
                      svalue: '95.7',
                    },
                    {
                      label: 'Iraq',
                      value: '33635000',
                      svalue: '79.7',
                    },
                    {
                      label: 'Israel',
                      value: '7653600',
                      svalue: '97.8',
                    },
                    {
                      label: 'Jordan',
                      value: '6318677',
                      svalue: '96.7',
                    },
                    {
                      label: 'Kuwait',
                      value: '3566437',
                      svalue: '96.2',
                    },
                    {
                      label: 'Lebanon',
                      value: '4228000',
                      svalue: '93.9',
                    },
                    {
                      label: 'Oman',
                      value: '2694094',
                      svalue: '94.8',
                    },
                    {
                      label: 'Palestine',
                      value: '4260636',
                      svalue: '96.7',
                    },
                    {
                      label: 'Qatar',
                      value: '1696563',
                      svalue: '97.8',
                    },
                    {
                      label: 'Saudi Arabia',
                      value: '27136977',
                      svalue: '94.7',
                    },
                    {
                      label: 'Syria',
                      value: '23695000',
                      svalue: '86.4',
                    },
                    {
                      label: 'United Arab Emirates',
                      value: '8264070',
                      svalue: '93.8',
                    },
                    {
                      label: 'Yemen',
                      value: '23580000',
                      svalue: '70.1',
                    },
                  ],
                },
                {
                  label: 'Central Asia',
                  value: '67986864',
                  svalue: '99.7',
                  data: [
                    {
                      label: 'Kazakhstan',
                      value: '17067216',
                      svalue: '99.8',
                    },
                    {
                      label: 'Kyrgyzstan',
                      value: '5940743',
                      svalue: '99.5',
                    },
                    {
                      label: 'Tajikistan',
                      value: '8628742',
                      svalue: '99.8',
                    },
                    {
                      label: 'Turkmenistan',
                      value: '5417285',
                      svalue: '99.7',
                    },
                    {
                      label: 'Uzbekistan',
                      value: '30932878',
                      svalue: '99.6',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Africa',
              value: '1206598718',
              svalue: '67.8',
              data: [
                {
                  label: 'East Africa',
                  value: '252185175',
                  svalue: '65.8',
                  data: [
                    {
                      label: 'Kenya',
                      value: '45010056',
                      svalue: '78',
                    },
                    {
                      label: 'Tanzania',
                      value: '51828923',
                      svalue: '80.3',
                    },
                    {
                      label: 'Uganda',
                      value: '37873253',
                      svalue: '73.9',
                    },
                    {
                      label: 'Djibouti',
                      value: '810178',
                      svalue: '67.9',
                    },
                    {
                      label: 'Eritrea',
                      value: '6380803',
                      svalue: '73.8',
                    },
                    {
                      label: 'Ethiopia',
                      value: '99465819',
                      svalue: '49.1',
                    },
                    {
                      label: 'Somalia',
                      value: '10816143',
                      svalue: '37.8',
                    },
                  ],
                },
                {
                  label: 'Western Africa',
                  value: '345670617',
                  svalue: '55.1',
                  data: [
                    {
                      label: 'Benin',
                      value: '10879829',
                      svalue: '38.4',
                    },
                    {
                      label: 'Burkina Faso',
                      value: '17322796',
                      svalue: '36',
                    },
                    {
                      label: 'Cape Verde',
                      value: '525000',
                      svalue: '87.6',
                    },
                    {
                      label: 'Gambia',
                      value: '1882450',
                      svalue: '55.5',
                    },
                    {
                      label: 'Ghana',
                      value: '27000000',
                      svalue: '76.6',
                    },
                    {
                      label: 'Guinea',
                      value: '11628972',
                      svalue: '30.4',
                    },
                    {
                      label: 'Guinea-Bissau',
                      value: '1693398',
                      svalue: '59.9',
                    },
                    {
                      label: 'Ivory Coast',
                      value: '23919000',
                      svalue: '48.7',
                    },
                    {
                      label: 'Liberia',
                      value: '4503000',
                      svalue: '47.6',
                    },
                    {
                      label: 'Mali',
                      value: '14517176',
                      svalue: '38.7',
                    },
                    {
                      label: 'Mauritania',
                      value: '4067564',
                      svalue: '52.1',
                    },
                    {
                      label: 'Niger',
                      value: '17138707',
                      svalue: '19.1',
                    },
                    {
                      label: 'Nigeria',
                      value: '182202000',
                      svalue: '59.6',
                    },
                    {
                      label: 'Saint Helena',
                      value: '5000',
                      svalue: '97',
                    },
                    {
                      label: 'Senegal',
                      value: '13567338',
                      svalue: '55.7',
                    },
                    {
                      label: 'Sierra Leone',
                      value: '7075641',
                      svalue: '48.1',
                    },
                    {
                      label: 'Sao Tome and Principe',
                      value: '190428',
                      svalue: '74.9',
                    },
                    {
                      label: 'Togo',
                      value: '7552318',
                      svalue: '66.5',
                    },
                  ],
                },
                {
                  label: 'North Africa',
                  value: '223391772',
                  svalue: '77.2',
                  data: [
                    {
                      label: 'Algeria',
                      value: '40400000',
                      svalue: '80.2',
                    },
                    {
                      label: 'Egypt',
                      value: '90928000',
                      svalue: '75.2',
                    },
                    {
                      label: 'Libya',
                      value: '6411776',
                      svalue: '91',
                    },
                    {
                      label: 'Morocco',
                      value: '33848242',
                      svalue: '72.4',
                    },
                    {
                      label: 'Sudan',
                      value: '40235000',
                      svalue: '75.9',
                    },
                    {
                      label: 'Tunisia',
                      value: '10982754',
                      svalue: '81.8',
                    },
                    {
                      label: 'Western Sahara',
                      value: '586000',
                      svalue: '64',
                    },
                  ],
                },
                {
                  label: 'Central Africa',
                  value: '122500569',
                  svalue: '62',
                  data: [
                    {
                      label: 'Burundi',
                      value: '11178921',
                      svalue: '85.6',
                    },
                    {
                      label: 'Central African Republic',
                      value: '4709000',
                      svalue: '36.8',
                    },
                    {
                      label: 'Chad',
                      value: '13670084',
                      svalue: '40.2',
                    },
                    {
                      label: 'Democratic Republic of the Congo',
                      value: '81680000',
                      svalue: '77.3',
                    },
                    {
                      label: 'Rwanda',
                      value: '11262564',
                      svalue: '70.5',
                    },
                  ],
                },
                {
                  label: 'Southern Africa',
                  value: '262850585',
                  svalue: '79',
                  data: [
                    {
                      label: 'Angola',
                      value: '24383301',
                      svalue: '71.1',
                    },
                    {
                      label: 'Botswana',
                      value: '2155784',
                      svalue: '88.5',
                    },
                    {
                      label: 'Democratic Republic of the Congo',
                      value: '81680000',
                      svalue: '79.3',
                    },
                    {
                      label: 'Lesotho',
                      value: '2067000',
                      svalue: '79.4',
                    },
                    {
                      label: 'Madagascar',
                      value: '22434363',
                      svalue: '64.7',
                    },
                    {
                      label: 'Malawi',
                      value: '16407000',
                      svalue: '65.8',
                    },
                    {
                      label: 'Mauritius',
                      value: '1261208',
                      svalue: '90.6',
                    },
                    {
                      label: 'Mozambique',
                      value: '24692144',
                      svalue: '58.8',
                    },
                    {
                      label: 'Namibia',
                      value: '2413077',
                      svalue: '81.9',
                    },
                    {
                      label: 'Seychelles',
                      value: '95000',
                      svalue: '95.2',
                    },
                    {
                      label: 'South Africa',
                      value: '54956900',
                      svalue: '94.3',
                    },
                    {
                      label: 'Swaziland',
                      value: '1119000',
                      svalue: '87.5',
                    },
                    {
                      label: 'Zambia',
                      value: '16212000',
                      svalue: '63.4',
                    },
                    {
                      label: 'Zimbabwe',
                      value: '12973808',
                      svalue: '86.5',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Europe',
              value: '510446883',
              svalue: '96',
              data: [
                {
                  label: 'Eastern Europe',
                  value: '70656886',
                  svalue: '99.5',
                  data: [
                    {
                      label: 'Czech Republic',
                      value: '10553443',
                      svalue: '99.7',
                    },
                    {
                      label: 'Croatia',
                      value: '4284889',
                      svalue: '99.3',
                    },
                    {
                      label: 'Hungary',
                      value: '9855571',
                      svalue: '99.1',
                    },
                    {
                      label: 'Poland',
                      value: '38483957',
                      svalue: '99.8',
                    },
                    {
                      label: 'Slovakia',
                      value: '5415949',
                      svalue: '99.6',
                    },
                    {
                      label: 'Slovenia',
                      value: '2063077',
                      svalue: '99.7',
                    },
                  ],
                },
                {
                  label: 'Western Europe',
                  value: '193882030',
                  svalue: '99.2',
                  data: [
                    {
                      label: 'Austria',
                      value: '8662588',
                      svalue: '98',
                    },
                    {
                      label: 'Belgium',
                      value: '11250585',
                      svalue: '99',
                    },
                    {
                      label: 'France',
                      value: '66660000',
                      svalue: '99',
                    },
                    {
                      label: 'Germany',
                      value: '81459000',
                      svalue: '99.8',
                    },
                    {
                      label: 'Liechtenstein',
                      value: '37340',
                      svalue: '100',
                    },
                    {
                      label: 'Luxembourg',
                      value: '562958',
                      svalue: '100',
                    },
                    {
                      label: 'Monaco',
                      value: '37800',
                      svalue: '99',
                    },
                    {
                      label: 'Netherlands',
                      value: '17000059',
                      svalue: '99',
                    },
                    {
                      label: 'Switzerland',
                      value: '8211700',
                      svalue: '99',
                    },
                  ],
                },
                {
                  label: 'Southern Europe',
                  value: '156301051',
                  svalue: '97.7',
                  data: [
                    {
                      label: 'Andorra',
                      value: '84082',
                      svalue: '100',
                    },
                    {
                      label: 'Portugal',
                      value: '11317192',
                      svalue: '95.7',
                    },
                    {
                      label: 'Spain',
                      value: '46030109',
                      svalue: '98.1',
                    },
                    {
                      label: 'Italy',
                      value: '60418711',
                      svalue: '99.2',
                    },
                    {
                      label: 'San Marino',
                      value: '31716',
                      svalue: '96',
                    },
                    {
                      label: 'Vatican City',
                      value: '826',
                      svalue: '100',
                    },
                    {
                      label: 'Albania',
                      value: '2821977',
                      svalue: '97.6',
                    },
                    {
                      label: 'Bosnia and Herzegovina',
                      value: '4613414',
                      svalue: '98.5',
                    },
                    {
                      label: 'Bulgaria',
                      value: '7364570',
                      svalue: '98.4',
                    },
                    {
                      label: 'Croatia',
                      value: '4489409',
                      svalue: '99.3',
                    },
                    {
                      label: 'Greece',
                      value: '11295002',
                      svalue: '97.7',
                    },
                    {
                      label: 'Kosovo',
                      value: '1859203',
                      svalue: '91.9',
                    },
                    {
                      label: 'Macedonia',
                      value: '2114550',
                      svalue: '97.8',
                    },
                    {
                      label: 'Malta',
                      value: '412966',
                      svalue: '94.1',
                    },
                    {
                      label: 'Montenegro',
                      value: '672181',
                      svalue: '98.7',
                    },
                    {
                      label: 'Serbia',
                      value: '712066',
                      svalue: '98.1',
                    },
                    {
                      label: 'Slovenia',
                      value: '2063077',
                      svalue: '99.7',
                    },
                  ],
                },
                {
                  label: 'Northern Europe',
                  value: '89606916',
                  svalue: '87.8',
                  data: [
                    {
                      label: 'Iceland',
                      value: '332529',
                      svalue: '99',
                    },
                    {
                      label: 'Ireland',
                      value: '4635400',
                      svalue: '17.9',
                    },
                    {
                      label: 'Latvia',
                      value: '1973700',
                      svalue: '99.9',
                    },
                    {
                      label: 'Lithuania',
                      value: '2875593',
                      svalue: '99.8',
                    },
                    {
                      label: 'Norway',
                      value: '5214900',
                      svalue: '100',
                    },
                    {
                      label: 'Sweden',
                      value: '9858794',
                      svalue: '99',
                    },
                    {
                      label: 'United Kingdom',
                      value: '64716000',
                      svalue: '99',
                    },
                  ],
                },
              ],
            },
            {
              label: 'North America',
              value: '398381811',
              svalue: '88.4',
              data: [
                {
                  label: 'Northern America',
                  value: '355073106',
                  svalue: '89',
                  data: [
                    {
                      label: 'Bermuda',
                      value: '64237',
                      svalue: '98',
                    },
                    {
                      label: 'Canada',
                      value: '35540419',
                      svalue: '50',
                    },
                    {
                      label: 'Greenland',
                      value: '56370',
                      svalue: '100',
                    },
                    {
                      label: 'Saint Pierre and Miquelon',
                      value: '6080',
                      svalue: '99',
                    },
                    {
                      label: 'United States',
                      value: '319406000',
                      svalue: '98',
                    },
                  ],
                },
                {
                  label: 'Central America',
                  value: '43308705',
                  svalue: '87.8',
                  data: [
                    {
                      label: 'Belize',
                      value: '334297',
                      svalue: '82.7',
                    },
                    {
                      label: 'Costa Rica',
                      value: '4695942',
                      svalue: '97.8',
                    },
                    {
                      label: 'El Salvador',
                      value: '6108590',
                      svalue: '88.4',
                    },
                    {
                      label: 'Guatemala',
                      value: '14373472',
                      svalue: '79.3',
                    },
                    {
                      label: 'Honduras',
                      value: '8448465',
                      svalue: '88.5',
                    },
                    {
                      label: 'Nicaragua',
                      value: '5788531',
                      svalue: '82.8',
                    },
                    {
                      label: 'Panama',
                      value: '3559408',
                      svalue: '95',
                    },
                  ],
                },
              ],
            },
            {
              label: 'South America',
              value: '403567675',
              svalue: '94.8',
              data: [
                {
                  label: 'Argentina',
                  value: '40482000',
                  svalue: '98.1',
                },
                {
                  label: 'Bolivia',
                  value: '9863000',
                  svalue: '95.7',
                },
                {
                  label: 'Brazil',
                  value: '202241714',
                  svalue: '92.6',
                },
                {
                  label: 'Chile',
                  value: '16928873',
                  svalue: '97.3',
                },
                {
                  label: 'Colombia',
                  value: '46920000',
                  svalue: '94.7',
                },
                {
                  label: 'Ecuador',
                  value: '14573101',
                  svalue: '94.5',
                },
                {
                  label: 'Falkland Islands',
                  value: '3140',
                  svalue: '99',
                },
                {
                  label: 'French Guiana',
                  value: '221500',
                  svalue: '83',
                },
                {
                  label: 'Guyana',
                  value: '772298',
                  svalue: '88.5',
                },
                {
                  label: 'Paraguay',
                  value: '6831306',
                  svalue: '95.6',
                },
                {
                  label: 'Peru',
                  value: '29132013',
                  svalue: '94.5',
                },
                {
                  label: 'South Georgia',
                  value: '20',
                  svalue: '99.8',
                },
                {
                  label: 'Suriname',
                  value: '472000',
                  svalue: '95.6',
                },
                {
                  label: 'Uruguay',
                  value: '3477780',
                  svalue: '98.4',
                },
                {
                  label: 'Venezuela',
                  value: '31648930',
                  svalue: '95.4',
                },
              ],
            },
            {
              label: 'Australia',
              value: '18283291',
              svalue: '67.9',
              data: [
                {
                  label: 'Sydney',
                  value: '4840628',
                  svalue: '99',
                },
                {
                  label: 'Melbourne',
                  value: '4440328',
                  svalue: '99',
                },
                {
                  label: 'Brisbane',
                  value: '2274560',
                  svalue: '99',
                },
                {
                  label: 'Perth',
                  value: '2021203',
                  svalue: '55',
                },
                {
                  label: 'Adelaide',
                  value: '1304631',
                  svalue: '52',
                },
                {
                  label: 'Gold Coast–Tweed Heads',
                  value: '614379',
                  svalue: '81.9',
                },
                {
                  label: 'Newcastle–Maitland',
                  value: '430755',
                  svalue: '85',
                },
                {
                  label: 'Canberra–Queanbeyan',
                  value: '422510',
                  svalue: '52',
                },
                {
                  label: 'Sunshine Coast',
                  value: '297380',
                  svalue: '51',
                },
                {
                  label: 'Wollongong',
                  value: '289236',
                  svalue: '55',
                },
                {
                  label: 'Hobart',
                  value: '219543',
                  svalue: '65',
                },
                {
                  label: 'Geelong',
                  value: '184182',
                  svalue: '60',
                },
                {
                  label: 'Townsville',
                  value: '178649',
                  svalue: '59.5',
                },
                {
                  label: 'Cairns',
                  value: '146778',
                  svalue: '84.1',
                },
                {
                  label: 'Darwin',
                  value: '140386',
                  svalue: '59.2',
                },
                {
                  label: 'Toowoomba',
                  value: '113625',
                  svalue: '78.5',
                },
                {
                  label: 'Ballarat',
                  value: '98543',
                  svalue: '41.2',
                },
                {
                  label: 'Bendigo',
                  value: '91692',
                  svalue: '47',
                },
                {
                  label: 'Albury–Wodonga',
                  value: '87890',
                  svalue: '78.2',
                },
                {
                  label: 'Launceston',
                  value: '86393',
                  svalue: '57',
                },
              ],
            },
            {
              label: 'Antarctica',
              value: '4490',
              svalue: '82.6',
              data: [
                {
                  label: 'Antarctica',
                  value: '4490',
                  svalue: '82.6',
                },
              ],
            },
          ],
        },
      ],
      colorrange: {
        mapbypercent: '1',
        gradient: '1',
        minvalue: '0',
        code: '#F2726F',
        startlabel: 'Low',
        endlabel: 'High',
        color: [
          {
            code: '#FFC533',
            maxvalue: '50',
            label: 'Mid',
          },
          {
            code: '#62B58F',
            maxvalue: '100',
            label: 'High',
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
        // onMessage is crucial for receiving messages from WebView
        onMessage={(event) => {
          // You can handle messages from the WebView here if needed
          // For example, if the chart emits events
          console.log('Message from WebView:', event.nativeEvent.data);
        }}
        onLoadEnd={() => {
          setWebViewLoaded(true);
          setTimeout(sendChartConfig, 100); // slight delay to ensure full readiness
        }}
      />
    </View>
  );
}
