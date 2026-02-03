/**
 * Notification configuration and settings
 */

import * as Notifications from 'expo-notifications';

/**
 * Configure how notifications are displayed when app is in foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Notification categories for different types of events
 */
export const NotificationCategories = {
  GUEST_JOINED: 'guest_joined',
  GUEST_ARRIVED: 'guest_arrived',
  GUEST_CANCELLED: 'guest_cancelled',
  GUEST_RUNNING_LATE: 'guest_running_late',
  RUNNING_LATE_REMINDER: 'running_late_reminder',
  EAT_AGAIN_MATCH: 'eat_again_match',
} as const;

/**
 * Get user's push token from database
 * Used when you need to send a notification to a specific user
 */
export async function getUserPushToken(userId: string, supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user push token:', error);
      return null;
    }

    return data?.push_token || null;
  } catch (error) {
    console.error('Error in getUserPushToken:', error);
    return null;
  }
}

/**
 * Get multiple users' push tokens from database
 * Used when you need to send notifications to multiple users (e.g., all guests)
 */
export async function getMultipleUserPushTokens(
  userIds: string[],
  supabase: any
): Promise<Map<string, string>> {
  const tokenMap = new Map<string, string>();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, push_token')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching multiple user push tokens:', error);
      return tokenMap;
    }

    data?.forEach((user: { id: string; push_token: string | null }) => {
      if (user.push_token) {
        tokenMap.set(user.id, user.push_token);
      }
    });

    return tokenMap;
  } catch (error) {
    console.error('Error in getMultipleUserPushTokens:', error);
    return tokenMap;
  }
}

/**
 * Schedule a local notification (does not require push tokens)
 * Useful for reminders and scheduled notifications
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  data?: any
) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        seconds: triggerSeconds,
      },
    });

    console.log(`📅 Scheduled local notification (ID: ${id}) in ${triggerSeconds}s`);
    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled local notification
 */
export async function cancelLocalNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Cancelled scheduled notification: ${notificationId}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled local notifications
 */
export async function cancelAllLocalNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Cancelled all scheduled notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}
