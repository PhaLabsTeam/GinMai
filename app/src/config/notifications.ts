/**
 * Notification configuration and settings
 */

import * as Notifications from 'expo-notifications';

// The Moment whose live screen is open. Guest events for it already show as an
// in-app toast there, so their push banner would be a duplicate.
let activeLiveMomentId: string | null = null;

export function setActiveLiveMoment(momentId: string | null) {
  activeLiveMomentId = momentId;
}

export function shouldShowInForeground(data: unknown): boolean {
  const { type, momentId } = (data ?? {}) as { type?: string; momentId?: string };
  const alreadyOnScreen =
    !!momentId && momentId === activeLiveMomentId && !!type && type.startsWith('guest_');
  return !alreadyOnScreen;
}

/**
 * Configure how notifications are displayed when app is in foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = shouldShowInForeground(notification?.request?.content?.data);
      return {
        // shouldShowAlert is deprecated in SDK 57: banner = on screen, list = in Notification Center
        shouldShowBanner: show,
        shouldShowList: true,
        shouldPlaySound: show,
        shouldSetBadge: true,
      };
    },
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
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
