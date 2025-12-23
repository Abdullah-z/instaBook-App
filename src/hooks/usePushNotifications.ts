import { useState, useEffect, useRef, useContext } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AuthContext } from '../auth/AuthContext';
import { savePushToken } from '../api/userAPI';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('voice_call', {
        name: 'Voice Call',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 2000, 500, 2000], // Long vibration for calls
        sound: 'ringtone.mp3', // This requires the custom sound file in android/app/src/main/res/raw
        lightColor: '#D4F637',
      });
      console.log('✅ Notification channels configured');
    } catch (err) {
      console.error('❌ Failed to configure notification channels:', err);
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the token depending on the projectId in app.json
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('✅ Expo Push Token obtained:', token);
    } catch (e) {
      console.error('❌ Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export const usePushNotifications = () => {
  const { user, token: authToken } = useContext(AuthContext);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    if (!user || !authToken) {
      console.log('⚠️ Skipping push notification registration: user or token missing');
      return;
    }

    console.log('🔔 Starting push notification registration for user:', user._id);

    registerForPushNotificationsAsync()
      .then(async (token) => {
        setExpoPushToken(token);
        if (token) {
          console.log('📤 Attempting to save push token to server...');
          try {
            const result = await savePushToken(token);
            console.log('✅ Push token saved to server:', result);
          } catch (error: any) {
            console.error('❌ Failed to save push token:', error);
            if (error.response) {
              console.error('Server response:', error.response.data);
            }
          }
        } else {
          console.warn('⚠️ No push token obtained');
        }
      })
      .catch((error: any) => {
        console.error('❌ Push notification registration failed:', error);
      });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification Received:', JSON.stringify(notification, null, 2));
      try {
        setNotification(notification);
      } catch (err) {
        console.error('❌ Error handling notification:', err);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, [user, authToken]);

  return {
    expoPushToken,
    notification,
    responseListener,
  };
};
