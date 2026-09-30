// Foreground banners for host pushes (#45): skip the banner when the host is
// already looking at that Moment's live screen, where the in-app toast shows.
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));

import { setActiveLiveMoment, shouldShowInForeground } from '../notifications';

describe('shouldShowInForeground', () => {
  afterEach(() => setActiveLiveMoment(null));

  it('shows guest events for other Moments', () => {
    setActiveLiveMoment('m1');
    expect(shouldShowInForeground({ type: 'guest_joined', momentId: 'm2' })).toBe(true);
  });

  it('hides guest events for the Moment on screen', () => {
    setActiveLiveMoment('m1');
    expect(shouldShowInForeground({ type: 'guest_arrived', momentId: 'm1' })).toBe(false);
  });

  it('always shows non-guest notifications', () => {
    setActiveLiveMoment('m1');
    expect(shouldShowInForeground({ type: 'moment_cancelled', momentId: 'm1' })).toBe(true);
    expect(shouldShowInForeground({ type: 'eat_again_match' })).toBe(true);
    expect(shouldShowInForeground(undefined)).toBe(true);
  });

  it('shows everything when no live screen is open', () => {
    expect(shouldShowInForeground({ type: 'guest_joined', momentId: 'm1' })).toBe(true);
  });
});
