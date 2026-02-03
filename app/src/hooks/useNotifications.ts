import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications and get token
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          console.log('✅ Push token received:', token);
        }
      })
      .catch(error => {
        console.error('❌ Error getting push token:', error);
      });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received (foreground):', notification);
      setNotification(notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data as any;
      console.log('Notification data:', data);

      // Handle navigation based on notification type
      if (data?.type === 'running_late_reminder' && data?.momentId) {
        console.log('🚀 Navigating to running-late screen for moment:', data.momentId);
        router.push(`/running-late?momentId=${data.momentId}`);
      }
      // Add more notification type handlers here as needed
    });

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    permissionStatus,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if running on physical device (required for push notifications)
  if (!Constants.isDevice) {
    console.warn('⚠️ Push notifications require a physical device');
    // Still proceed for testing purposes
  }

  try {
    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F97316',
        sound: 'default',
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permission to receive push notifications was denied');
      return null;
    }

    console.log('✅ Notification permissions granted');

    // Get the push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    token = tokenData.data;
    console.log('📱 Expo Push Token:', token);

  } catch (error) {
    console.error('❌ Error in registerForPushNotificationsAsync:', error);
  }

  return token;
}

// Utility function to send a test notification locally
export async function sendTestNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: {
      seconds: 1,
    },
  });
}
