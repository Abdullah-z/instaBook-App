import 'react-native-gesture-handler';
import React from 'react';
import { DataProvider, useData } from './src/hooks';
import AppNavigation from './src/navigation/App';
import { PaperProvider } from 'react-native-paper';
import { BlueDark } from './src/constants/themes/BlueDark';
import { BlueLight } from './src/constants/themes/BlueLight';
import { GreenDark } from './src/constants/themes/GreenDark';
import { GreenLight } from './src/constants/themes/GreenLight';
import { YellowDark } from './src/constants/themes/YellowDark';
import { YellowLight } from './src/constants/themes/YellowLight';
import { RedLight } from './src/constants/themes/RedLight';
import { PurpleLight } from './src/constants/themes/PurpleLight';
import { OrangeLight } from './src/constants/themes/OrangeLight';
import { OrangeDark } from './src/constants/themes/OrangeDark';
import { RedDark } from './src/constants/themes/RedDark';
import { PurpleDark } from './src/constants/themes/PurpleDark';
import RootStack from './src/navigation';

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}

function MainApp() {
  const { isDark, themeColor } = useData();

  console.log(themeColor);
  // Define a mapping of shorthand keys to theme objects
  const themeMap = {
    b: isDark ? BlueDark : BlueLight,
    g: isDark ? GreenDark : GreenLight,
    y: isDark ? YellowDark : YellowLight,
    r: isDark ? RedDark : RedLight,
    p: isDark ? PurpleDark : PurpleLight,
    o: isDark ? OrangeDark : OrangeLight,
  };

  // Select the theme based on the selected color
  const theme = themeMap[themeColor] || themeMap['r']; // Default to 'r' (red) if themeColor is undefined

  return (
    <PaperProvider theme={theme}>
      <RootStack />
    </PaperProvider>
  );
}
