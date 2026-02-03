/**
 * Hook to automatically schedule running late reminders for moments
 */

import { useEffect } from 'react';
import { useMomentStore } from '../stores/momentStore';
import { useAuthStore } from '../stores/authStore';
import { scheduleRunningLateReminder, cancelRunningLateReminder } from '../services/reminderService';

export function useMomentReminders() {
  const moments = useMomentStore((state) => state.moments);
  const userConnections = useMomentStore((state) => state.userConnections);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    // Schedule reminders for all upcoming moments user is connected to
    const scheduledReminders: string[] = [];

    userConnections.forEach((connection) => {
      // Only schedule for confirmed connections (not cancelled or completed)
      if (connection.status !== 'confirmed') return;

      const moment = moments.find((m) => m.id === connection.momentId);
      if (!moment) return;

      // Check if moment is in the future
      const momentTime = new Date(moment.starts_at);
      const now = new Date();

      if (momentTime > now) {
        const location = moment.location.place_name || moment.location.area_name || 'your location';

        scheduleRunningLateReminder(moment.id, momentTime, location)
          .then((scheduled) => {
            if (scheduled) {
              scheduledReminders.push(moment.id);
              console.log(`⏰ Scheduled reminder for moment: ${moment.id}`);
            }
          })
          .catch((err) => {
            console.error('Error scheduling reminder:', err);
          });
      }
    });

    // Cleanup: cancel reminders when component unmounts or connections change
    return () => {
      scheduledReminders.forEach((momentId) => {
        cancelRunningLateReminder(momentId).catch((err) => {
          console.error('Error cancelling reminder:', err);
        });
      });
    };
  }, [moments, userConnections, user]);

  return null; // This hook doesn't return anything, it just manages reminders
}
