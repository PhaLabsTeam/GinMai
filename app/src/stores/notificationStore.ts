import { create } from "zustand";
import { AppState } from "react-native";
import { sendPushNotification, NotificationTemplates } from "../utils/sendPushNotification";

export interface InAppNotification {
  id: string;
  type: "guest_joined" | "guest_cancelled" | "guest_arrived" | "guest_running_late" | "info";
  title: string;
  message: string;
  momentId?: string;
  guestName?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;

  // Actions
  addNotification: (
    notification: Omit<InAppNotification, "id" | "createdAt" | "read">,
    options?: {
      pushToken?: string; // Send push notification to this token
      sendPush?: boolean; // Force send push notification
    }
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification, options = {}) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // Check if app is in foreground or background
    const appState = AppState.currentState;
    const isAppInForeground = appState === 'active';

    // Add to in-app notification list (always do this)
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
      unreadCount: state.unreadCount + 1,
    }));

    // Send push notification if:
    // 1. Push token is provided AND (app is in background OR sendPush is forced)
    if (options.pushToken && (!isAppInForeground || options.sendPush)) {
      sendPushNotificationForEvent(
        notification.type,
        notification.title,
        notification.message,
        options.pushToken,
        notification.momentId,
        notification.guestName
      );
    }

    // Auto-dismiss after 5 seconds for toast-style notifications (only if in foreground)
    if (isAppInForeground) {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, 5000);
    }
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

/**
 * Helper function to send push notifications based on event type
 */
async function sendPushNotificationForEvent(
  type: InAppNotification['type'],
  title: string,
  message: string,
  pushToken: string,
  momentId?: string,
  guestName?: string
) {
  try {
    let payload;

    switch (type) {
      case 'guest_joined':
        if (momentId && guestName) {
          payload = NotificationTemplates.guestJoined(pushToken, guestName, momentId);
        }
        break;

      case 'guest_arrived':
        if (momentId && guestName) {
          payload = NotificationTemplates.guestArrived(pushToken, guestName, momentId);
        }
        break;

      case 'guest_cancelled':
        if (momentId && guestName) {
          payload = NotificationTemplates.guestCancelled(pushToken, guestName, momentId);
        }
        break;

      case 'guest_running_late':
        if (momentId && guestName) {
          payload = NotificationTemplates.guestRunningLate(pushToken, guestName, momentId);
        }
        break;

      case 'info':
      default:
        // Generic notification
        payload = {
          to: pushToken,
          title,
          body: message,
          data: { type, momentId },
        };
        break;
    }

    if (payload) {
      await sendPushNotification(payload);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
