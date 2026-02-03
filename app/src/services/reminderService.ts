/**
 * Reminder Service
 * Handles scheduling of running late reminders and other time-based notifications
 */

import * as Notifications from 'expo-notifications';
import { scheduleLocalNotification, cancelLocalNotification } from '../config/notifications';

interface ScheduledReminder {
  momentId: string;
  notificationId: string;
  scheduledFor: Date;
}

// Store active reminders
const activeReminders = new Map<string, ScheduledReminder>();

/**
 * Schedule a "running late?" reminder for a moment
 * Sends notification 10 minutes before the moment starts
 */
export async function scheduleRunningLateReminder(
  momentId: string,
  momentStartTime: Date,
  momentLocation: string
): Promise<boolean> {
  try {
    // Calculate when to send reminder (10 minutes before)
    const reminderTime = new Date(momentStartTime.getTime() - 10 * 60 * 1000);
    const now = new Date();
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

    // Don't schedule if reminder time has passed or is too soon (< 30 seconds)
    if (secondsUntilReminder < 30) {
      console.log('⏰ Reminder time has passed or is too soon, skipping');
      return false;
    }

    // Cancel existing reminder for this moment if any
    await cancelRunningLateReminder(momentId);

    // Schedule the notification
    const notificationId = await scheduleLocalNotification(
      'Your meal starts soon',
      `Your lunch at ${momentLocation} starts in 10 minutes. Running late?`,
      secondsUntilReminder,
      {
        type: 'running_late_reminder',
        momentId,
        action: 'check_late_status',
      }
    );

    if (notificationId) {
      // Store reminder info
      activeReminders.set(momentId, {
        momentId,
        notificationId,
        scheduledFor: reminderTime,
      });

      console.log(`✅ Scheduled running late reminder for moment ${momentId}`);
      console.log(`   Reminder will fire in ${Math.floor(secondsUntilReminder / 60)} minutes`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error scheduling running late reminder:', error);
    return false;
  }
}

/**
 * Cancel a running late reminder for a moment
 */
export async function cancelRunningLateReminder(momentId: string): Promise<void> {
  const reminder = activeReminders.get(momentId);

  if (reminder) {
    await cancelLocalNotification(reminder.notificationId);
    activeReminders.delete(momentId);
    console.log(`✅ Cancelled running late reminder for moment ${momentId}`);
  }
}

/**
 * Get all active reminders
 */
export function getActiveReminders(): ScheduledReminder[] {
  return Array.from(activeReminders.values());
}

/**
 * Clear all reminders (useful for cleanup)
 */
export async function clearAllReminders(): Promise<void> {
  const reminderIds = Array.from(activeReminders.values());

  for (const reminder of reminderIds) {
    await cancelLocalNotification(reminder.notificationId);
  }

  activeReminders.clear();
  console.log('✅ Cleared all running late reminders');
}

/**
 * Check if a reminder is scheduled for a moment
 */
export function hasReminder(momentId: string): boolean {
  return activeReminders.has(momentId);
}

/**
 * Get reminder info for a moment
 */
export function getReminder(momentId: string): ScheduledReminder | undefined {
  return activeReminders.get(momentId);
}
