import React, { useContext, useEffect } from 'react';
import { AuthProvider } from './src/auth/AuthContext';
import { SocketProvider } from './src/auth/SocketContext';
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
import { useData, usePushNotifications } from './src/hooks';
import * as Notifications from 'expo-notifications';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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
      <SocketProvider>
        <VoiceCallProvider>
          <PaperProvider theme={theme}>
            <AppContent />
          </PaperProvider>
        </VoiceCallProvider>
      </SocketProvider>
    </AuthProvider>
  );
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
