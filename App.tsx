import React from 'react';
import { AuthProvider } from './src/auth/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
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
import { useData } from './src/hooks';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'; // ✅ CORRECT
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return <MainApp />;
}

function MainApp() {
  const { isDark, themeColor } = useData();

  const themeMap = {
    b: isDark ? BlueDark : BlueLight,
    g: isDark ? GreenDark : GreenLight,
    y: isDark ? YellowDark : YellowLight,
    r: isDark ? RedDark : RedLight,
    p: isDark ? PurpleDark : PurpleLight,
    o: isDark ? OrangeDark : OrangeLight,
  };

  const theme = themeMap[themeColor] || themeMap['r'];

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </AuthProvider>
  );
}
