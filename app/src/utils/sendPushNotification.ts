/**
 * Send push notifications using Expo Push Notification Service
 *
 * This is the client-side implementation (Option B from M4 plan).
 * For production, consider moving to Supabase Edge Functions (Option A).
 */

export interface PushNotificationData {
  type: 'guest_joined' | 'guest_arrived' | 'guest_cancelled' | 'guest_running_late' | 'running_late_reminder' | 'eat_again_match';
  momentId?: string;
  guestName?: string;
  [key: string]: any;
}

export interface PushNotificationPayload {
  to: string | string[]; // Expo push token(s)
  title: string;
  body: string;
  data?: PushNotificationData;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification to one or more devices
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{
  success: boolean;
  error?: string;
  tickets?: any[];
}> {
  try {
    const message = {
      to: payload.to,
      sound: payload.sound ?? 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      priority: payload.priority ?? 'high',
      channelId: payload.channelId ?? 'default',
      badge: payload.badge,
    };

    console.log('📤 Sending push notification:', {
      to: Array.isArray(payload.to) ? `${payload.to.length} recipients` : '1 recipient',
      title: payload.title,
    });

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Push notification failed:', result);
      return {
        success: false,
        error: result.error || 'Failed to send notification',
      };
    }

    console.log('✅ Push notification sent:', result);

    return {
      success: true,
      tickets: result.data,
    };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendBulkPushNotifications(
  notifications: PushNotificationPayload[]
): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}> {
  const results = await Promise.allSettled(
    notifications.map(notification => sendPushNotification(notification))
  );

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
    } else {
      failureCount++;
      const error = result.status === 'fulfilled'
        ? result.value.error
        : result.reason;
      errors.push(`Notification ${index}: ${error}`);
    }
  });

  return {
    success: failureCount === 0,
    successCount,
    failureCount,
    errors,
  };
}

/**
 * Helper function to create notification payloads for common events
 */
export const NotificationTemplates = {
  guestJoined: (pushToken: string, guestName: string, momentId: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'New guest! 🎉',
    body: `${guestName} wants to join your lunch`,
    data: {
      type: 'guest_joined',
      momentId,
      guestName,
    },
  }),

  guestArrived: (pushToken: string, guestName: string, momentId: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'Guest arrived!',
    body: `${guestName} is here`,
    data: {
      type: 'guest_arrived',
      momentId,
      guestName,
    },
  }),

  guestCancelled: (pushToken: string, guestName: string, momentId: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'Guest cancelled',
    body: `${guestName} can't make it anymore`,
    data: {
      type: 'guest_cancelled',
      momentId,
      guestName,
    },
  }),

  guestRunningLate: (pushToken: string, guestName: string, momentId: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'Running late',
    body: `${guestName} is running a few minutes late`,
    data: {
      type: 'guest_running_late',
      momentId,
      guestName,
    },
  }),

  runningLateReminder: (pushToken: string, timeUntilMeal: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'Your lunch starts soon',
    body: `Your meal starts in ${timeUntilMeal}. Running late?`,
    data: {
      type: 'running_late_reminder',
    },
  }),

  eatAgainMatch: (pushToken: string, matchedUserName: string): PushNotificationPayload => ({
    to: pushToken,
    title: 'You matched! 🎉',
    body: `You and ${matchedUserName} want to eat again!`,
    data: {
      type: 'eat_again_match',
    },
  }),
};
