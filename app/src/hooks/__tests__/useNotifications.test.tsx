// SDK 57 removed Notifications.removeNotificationSubscription and deprecated
// shouldShowAlert (#40). The mock mirrors the SDK 57 surface: calling the
// removed function would throw, just like it would at runtime.

jest.mock('expo-notifications', () => {
  const makeSubscription = () => ({ remove: jest.fn() });
  return {
    setNotificationHandler: jest.fn(),
    addNotificationReceivedListener: jest.fn(makeSubscription),
    addNotificationResponseReceivedListener: jest.fn(makeSubscription),
    getPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
    getExpoPushTokenAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(async () => 'id'),
    AndroidImportance: { MAX: 5 },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  };
});

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications, sendTestNotification } from '../useNotifications';

const mocked = Notifications as jest.Mocked<typeof Notifications>;

describe('useNotifications (SDK 57 API)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('removes both listeners on unmount without the removed API', () => {
    const { unmount } = renderHook(() => useNotifications());

    const received = mocked.addNotificationReceivedListener.mock.results[0].value;
    const response = mocked.addNotificationResponseReceivedListener.mock.results[0].value;

    expect(() => unmount()).not.toThrow();
    expect(received.remove).toHaveBeenCalledTimes(1);
    expect(response.remove).toHaveBeenCalledTimes(1);
  });

  it('configures the foreground handler with banner/list instead of alert', async () => {
    const handler = mocked.setNotificationHandler.mock.calls[0][0]!;
    const behavior = await handler.handleNotification({} as any);

    expect(behavior).toEqual(
      expect.objectContaining({ shouldShowBanner: true, shouldShowList: true })
    );
    expect(behavior).not.toHaveProperty('shouldShowAlert');
  });

  it('opens the live screen when a host taps a guest push, the map for a cancellation', () => {
    const { router } = require('expo-router');
    renderHook(() => useNotifications());
    const onTap = mocked.addNotificationResponseReceivedListener.mock.calls[0][0] as any;
    const tap = (data: any) => onTap({ notification: { request: { content: { data } } } });

    tap({ type: 'guest_joined', momentId: 'm1' });
    expect(router.push).toHaveBeenCalledWith('/moment-live?momentId=m1');

    tap({ type: 'moment_cancelled', momentId: 'm1' });
    expect(router.push).toHaveBeenCalledWith('/map');
  });

  it('schedules test notifications with a typed trigger', async () => {
    await sendTestNotification('Hi', 'Body');

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: { type: 'timeInterval', seconds: 1 },
      })
    );
  });
});
