/**
 * Hook to automatically schedule running late reminders for moments
 */

import { useEffect } from 'react';
import { useMomentStore } from '../stores/momentStore';
import { useAuthStore } from '../stores/authStore';
import { scheduleRunningLateReminder, cancelRunningLateReminder } from '../services/reminderService';

export function useMomentReminders() {
  const moments = useMomentStore((state) => state.moments);
  const momentsById = useMomentStore((state) => state.momentsById);
  const findMoment = useMomentStore((state) => state.findMoment);
  const userConnections = useMomentStore((state) => state.userConnections);
  const user = useAuthStore((state) => state.user);

  const remindersOn = user?.notify_reminders !== false;

  useEffect(() => {
    if (!user) return;

    // "Meal reminders" off in Settings: clear any already scheduled
    if (!remindersOn) {
      userConnections.forEach((c) => cancelRunningLateReminder(c.momentId).catch(() => {}));
      moments
        .filter((m) => m.host_id === user.id)
        .forEach((m) => cancelRunningLateReminder(m.id).catch(() => {}));
      return;
    }

    // Schedule reminders for all upcoming moments user is connected to
    const scheduledReminders: string[] = [];

    // 1. Schedule reminders for moments the user is HOSTING
    const candidates = [...moments, ...Object.values(momentsById)];
    const hostedMoments = candidates.filter(
      (m, i) => m.host_id === user.id && candidates.findIndex((o) => o.id === m.id) === i
    );
    hostedMoments.forEach((moment) => {
      // A full table still needs its reminder
      if (moment.status !== 'active' && moment.status !== 'full') return;

      const momentTime = new Date(moment.starts_at);
      const now = new Date();

      if (momentTime > now) {
        const location = moment.location.place_name || moment.location.area_name || 'your location';

        scheduleRunningLateReminder(moment.id, momentTime, location)
          .then((scheduled) => {
            if (scheduled) {
              scheduledReminders.push(moment.id);
              console.log(`⏰ Scheduled reminder for hosted moment: ${moment.id}`);
            }
          })
          .catch((err) => {
            console.error('Error scheduling reminder:', err);
          });
      }
    });

    // 2. Schedule reminders for moments the user has JOINED
    userConnections.forEach((connection) => {
      // Only schedule for confirmed connections (not cancelled or completed)
      if (connection.status !== 'confirmed') return;

      const moment = findMoment(connection.momentId);
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
              console.log(`⏰ Scheduled reminder for joined moment: ${moment.id}`);
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
  }, [moments, momentsById, userConnections, user, remindersOn, findMoment]);

  return null; // This hook doesn't return anything, it just manages reminders
}
