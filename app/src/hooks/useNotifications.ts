import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { configureNotificationHandler } from '../config/notifications';

type NotificationSubscription = ReturnType<typeof Notifications.addNotificationReceivedListener>;

configureNotificationHandler();

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

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
        router.push(`/running-late?momentId=${data.momentId}`);
      } else if (typeof data?.type === 'string' && data.type.startsWith('guest_') && data?.momentId) {
        // Sent to the host by the database (#45): open their live screen
        router.push(`/moment-live?momentId=${data.momentId}`);
      } else if (data?.type === 'moment_cancelled') {
        router.push('/map');
      }
    });

    return () => {
      // SDK 57 removed removeNotificationSubscription; subscriptions remove themselves
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    permissionStatus,
    notification,
  };
}

/**
 * Returns an Expo push token when notifications are allowed. Only shows the
 * system prompt when `askIfNeeded` is set: at launch we never ask, because a
 * prompt before the user knows what it's for gets reflexively declined and
 * iOS only shows it once (#20). See maybeAskForPushPermission.
 */
export async function registerForPushNotificationsAsync(askIfNeeded = false): Promise<string | null> {
  let token: string | null = null;

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

    if (existingStatus !== 'granted' && askIfNeeded) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    console.log('✅ Notification permissions granted');

    // Get the push token
    // Needs an APNs device token first; if that never arrives the call can wait
    // forever with no error, so give up (and say so) after a while
    const tokenData = await Promise.race([
      Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out waiting for a push token')), 15000)
      ),
    ]);

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
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
}
