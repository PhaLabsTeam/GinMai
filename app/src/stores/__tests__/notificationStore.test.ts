import { renderHook, act } from '@testing-library/react-native';
import { useNotificationStore } from '../notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    // Reset notifications before each test
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.clearNotifications();
    });
    // Use fake timers to prevent setTimeout from causing issues
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clear timers after each test
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('notification management', () => {
    it('should add notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join',
          momentId: 'moment-1',
          guestName: 'Alex',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('New guest!');
      expect(result.current.notifications[0].type).toBe('guest_joined');
    });

    it('should remove notification by id', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join',
          momentId: 'moment-1',
          guestName: 'Alex',
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle multiple notifications', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join',
          momentId: 'moment-1',
          guestName: 'Alex',
        });

        result.current.addNotification({
          type: 'guest_arrived',
          title: 'Guest arrived!',
          message: 'Sam is here',
          momentId: 'moment-1',
          guestName: 'Sam',
        });

        result.current.addNotification({
          type: 'guest_cancelled',
          title: 'Guest cancelled',
          message: 'Jordan can\'t make it',
          momentId: 'moment-1',
          guestName: 'Jordan',
        });
      });

      expect(result.current.notifications).toHaveLength(3);
    });

    it('should remove specific notification without affecting others', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'First notification',
          message: 'First message',
          momentId: 'moment-1',
          guestName: 'User1',
        });

        result.current.addNotification({
          type: 'guest_arrived',
          title: 'Second notification',
          message: 'Second message',
          momentId: 'moment-1',
          guestName: 'User2',
        });
      });

      // Notifications are prepended, so notifications[0] is the most recent ("Second notification")
      const secondId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(secondId);
      });

      expect(result.current.notifications).toHaveLength(1);
      // After removing "Second notification", only "First notification" remains
      expect(result.current.notifications[0].title).toBe('First notification');
    });
  });

  describe('notification types', () => {
    it('should handle guest_joined notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join your lunch',
          momentId: 'moment-1',
          guestName: 'Alex',
        });
      });

      const notification = result.current.notifications[0];
      expect(notification.type).toBe('guest_joined');
      expect(notification.guestName).toBe('Alex');
    });

    it('should handle guest_cancelled notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_cancelled',
          title: 'Guest cancelled',
          message: 'Sam can\'t make it',
          momentId: 'moment-1',
          guestName: 'Sam',
        });
      });

      const notification = result.current.notifications[0];
      expect(notification.type).toBe('guest_cancelled');
      expect(notification.message).toContain('can\'t make it');
    });

    it('should handle guest_arrived notification', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_arrived',
          title: 'Guest arrived',
          message: 'Jordan is here',
          momentId: 'moment-1',
          guestName: 'Jordan',
        });
      });

      const notification = result.current.notifications[0];
      expect(notification.type).toBe('guest_arrived');
      expect(notification.guestName).toBe('Jordan');
    });

    it('should track unread count', () => {
      const { result } = renderHook(() => useNotificationStore());

      expect(result.current.unreadCount).toBe(0);

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join',
          momentId: 'moment-1',
          guestName: 'Alex',
        });
      });

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        result.current.addNotification({
          type: 'guest_arrived',
          title: 'Guest arrived',
          message: 'Sam is here',
          momentId: 'moment-1',
          guestName: 'Sam',
        });
      });

      expect(result.current.unreadCount).toBe(2);
    });

    it('should mark notification as read', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'New guest!',
          message: 'Alex wants to join',
          momentId: 'moment-1',
          guestName: 'Alex',
        });
      });

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.markAsRead(notificationId);
      });

      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should mark all as read', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'First',
          message: 'First message',
          momentId: 'moment-1',
          guestName: 'User1',
        });

        result.current.addNotification({
          type: 'guest_arrived',
          title: 'Second',
          message: 'Second message',
          momentId: 'moment-1',
          guestName: 'User2',
        });
      });

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.markAllAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle removing non-existent notification gracefully', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'guest_joined',
          title: 'Test',
          message: 'Test message',
          momentId: 'moment-1',
          guestName: 'Test User',
        });
      });

      const initialLength = result.current.notifications.length;

      act(() => {
        result.current.removeNotification('non-existent-id');
      });

      expect(result.current.notifications).toHaveLength(initialLength);
    });

    it('should handle empty notification list', () => {
      const { result } = renderHook(() => useNotificationStore());

      expect(result.current.notifications).toHaveLength(0);

      act(() => {
        result.current.removeNotification('any-id');
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });
});
