// Notification permission is asked after hosting/joining, with an in-app
// explanation first, and never at launch (#20).

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]' })),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('../../stores/authStore', () => {
  const updatePushToken = jest.fn(async () => {});
  return { useAuthStore: { getState: () => ({ updatePushToken }) }, __updatePushToken: updatePushToken };
});

import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../hooks/useNotifications';

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const { __updatePushToken: updatePushToken } = require('../../stores/authStore');

// The module remembers "asked this session", so load a fresh copy per test
function loadAsk() {
  let ask: typeof import('../pushPermission').maybeAskForPushPermission;
  jest.isolateModules(() => {
    ask = require('../pushPermission').maybeAskForPushPermission;
  });
  return ask!;
}

// Tap a button in the next Alert.alert by its label
function answerAlert(label: string) {
  jest.spyOn(Alert, 'alert').mockImplementationOnce((_title, _message, buttons) => {
    buttons?.find((b) => b.text === label)?.onPress?.();
  });
}

describe('push permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('does not prompt at launch', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);

    const token = await registerForPushNotificationsAsync();

    expect(token).toBeNull();
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('explains first, then asks and saves the token when the user agrees', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true } as any);
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    answerAlert('Yes, notify me');

    await loadAsk()('hosting');

    expect(Alert.alert).toHaveBeenCalledWith('Want a heads-up?', expect.stringMatching(/joins your table/), expect.any(Array));
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(updatePushToken).toHaveBeenCalledWith('ExponentPushToken[test]');
  });

  it('never shows the system prompt after "Not now"', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true } as any);
    answerAlert('Not now');

    const ask = loadAsk();
    await ask('joined');
    await ask('joined'); // same session: not asked again

    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('stays quiet once the user has decided', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false } as any);
    const alert = jest.spyOn(Alert, 'alert');

    await loadAsk()('hosting');

    expect(alert).not.toHaveBeenCalled();
  });
});
