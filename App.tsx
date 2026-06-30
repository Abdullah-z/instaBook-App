import React, { useContext, useEffect } from 'react';
import { AuthProvider } from './src/auth/AuthContext';
import useSocketStore from './src/store/useSocketStore';
import { AuthContext } from './src/auth/AuthContext';
import { VoiceCallProvider, VoiceCallContext } from './src/auth/VoiceCallContext';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import VoiceCallScreen from './src/components/VoiceCallScreen';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, navigate, flushNavigationQueue } from './src/navigation/RootNavigation';
import Toast from 'react-native-toast-message';
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
import { NeonPinkLight } from './src/constants/themes/NeonPinkLight';
import { NeonPinkDark } from './src/constants/themes/NeonPinkDark';
import { NeonCyanLight } from './src/constants/themes/NeonCyanLight';
import { NeonCyanDark } from './src/constants/themes/NeonCyanDark';
import { NeonLimeLight } from './src/constants/themes/NeonLimeLight';
import { NeonLimeDark } from './src/constants/themes/NeonLimeDark';
import { ElectricBlueLight } from './src/constants/themes/ElectricBlueLight';
import { ElectricBlueDark } from './src/constants/themes/ElectricBlueDark';
import { PastelOrangeDark } from './src/constants/themes/PastelOrangeDark';
import { PastelOrangeLight } from './src/constants/themes/PastelOrangeLight';
import { NothingDark } from './src/constants/themes/NothingDark';
import { NothingLight } from './src/constants/themes/NothingLight';
import { MonochromeDark } from './src/constants/themes/MonochromeDark';
import { MonochromeLight } from './src/constants/themes/MonochromeLight';
import { DataProvider, useData, usePushNotifications, ThemeProvider } from './src/hooks';
import * as Notifications from 'expo-notifications';
import { light } from './src/constants';
import { ITheme } from './src/constants/types';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Black': Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) {
        console.error('❌ Font Loading Error:', fontError);
      }
      SplashScreen.hideAsync().catch((err) => {
        console.warn('Failed to hide splash screen:', err);
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}

function MainApp() {
  const { isDark, themeColor, themeLoaded } = useData();

  if (!themeLoaded) return null; // Or a splash screen

  const themeMap = {
    g: isDark ? GreenDark : GreenLight,
    b: isDark ? BlueDark : BlueLight,
    p: isDark ? PurpleDark : PurpleLight,
    r: isDark ? RedDark : RedLight,
    o: isDark ? OrangeDark : OrangeLight,
    y: isDark ? YellowDark : YellowLight,
    np: isDark ? NeonPinkDark : NeonPinkLight,
    nc: isDark ? NeonCyanDark : NeonCyanLight,
    nl: isDark ? NeonLimeDark : NeonLimeLight,
    eb: isDark ? ElectricBlueDark : ElectricBlueLight,
    po: isDark ? PastelOrangeDark : PastelOrangeLight,
    n: isDark ? NothingDark : NothingLight,
    m: isDark ? MonochromeDark : MonochromeLight,
  };

  const paperTheme = themeMap[themeColor as keyof typeof themeMap] || themeMap['g'];

  const theme: ITheme = {
    ...light,
    ...paperTheme,
    colors: {
      ...light.colors,
      ...paperTheme.colors,
    },
    fonts: light.fonts,
  };

  return (
    <AuthProvider>
      <StoreInitializer />
      <VoiceCallProvider>
          <PaperProvider theme={paperTheme}>
            <ThemeProvider theme={theme}>
              <AppContent />
            </ThemeProvider>
          </PaperProvider>
      </VoiceCallProvider>
    </AuthProvider>
  );
}

function StoreInitializer() {
  const { user, token } = useContext(AuthContext);
  const connectSocket = useSocketStore(state => state.connectSocket);
  const disconnectSocket = useSocketStore(state => state.disconnectSocket);
  const refreshNotifications = useSocketStore(state => state.refreshNotifications);

  useEffect(() => {
    if (token) {
      refreshNotifications(token);
    }
    if (token && user) {
      connectSocket(user, token);
    } else {
      disconnectSocket();
    }
  }, [user, token]);

  return null;
}

function AppContent() {
  const { handleIncomingCallFromPush } = useContext(VoiceCallContext);
  const { expoPushToken } = usePushNotifications();

  // Handle Notifications when app is running (foreground/background)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('🔔 Notification Response Received:', data);

      if (data?.type === 'MESSAGE') {
        const isGroup = data?.isGroup === true || data?.isGroup === 'true';
        const targetId = isGroup ? data?.conversationId : data?.senderId;
        const targetName = isGroup ? data?.groupName || 'Group Chat' : data?.senderName || 'User';
        const targetAvatar = isGroup ? null : data?.senderAvatar || null;

        if (targetId) {
          navigate('Chat', {
            userId: targetId,
            username: targetName,
            avatar: targetAvatar,
            isGroup: isGroup,
          });
        }
      } else if (data?.type === 'VOICE_CALL') {
        handleIncomingCallFromPush(data);
      } else if ((data?.type === 'AUCTION_WON' || data?.type === 'NEW_BID') && data?.listingId) {
        navigate('ListingDetail', { id: data.listingId });
      }
    });

    return () => subscription.remove();
  }, [handleIncomingCallFromPush]);

  // Handle Cold Start Notification (App was killed)
  useEffect(() => {
    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const data = response.notification.request.content.data;
          console.log('🔔 Cold Start Notification Detected:', data);

          if (data?.type === 'MESSAGE') {
            const isGroup = data?.isGroup === true || data?.isGroup === 'true';
            const targetId = isGroup ? data?.conversationId : data?.senderId;
            const targetName = isGroup
              ? data?.groupName || 'Group Chat'
              : data?.senderName || 'User';
            const targetAvatar = isGroup ? null : data?.senderAvatar || null;

            if (targetId) {
              navigate('Chat', {
                userId: targetId,
                username: targetName,
                avatar: targetAvatar,
                isGroup: isGroup,
              });
            }
          } else if (data?.type === 'VOICE_CALL') {
            handleIncomingCallFromPush(data);
          } else if (
            (data?.type === 'AUCTION_WON' || data?.type === 'NEW_BID') &&
            data?.listingId
          ) {
            navigate('ListingDetail', { id: data.listingId });
          }
        }
      } catch (e) {
        console.error('❌ Failed to get last notification response:', e);
      }
    };

    checkInitialNotification();
  }, [handleIncomingCallFromPush]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            console.log('✅ NavigationContainer is ready');
            flushNavigationQueue();
          }}>
          <VoiceCallScreen />
          <AppNavigator />
        </NavigationContainer>
        <Toast />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
